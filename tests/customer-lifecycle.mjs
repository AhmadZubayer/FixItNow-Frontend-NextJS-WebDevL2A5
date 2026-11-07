import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const frontendDirectory = process.cwd();
const backendDirectory = resolve(frontendDirectory, "../FixItNow-backend-server");
const technicianFile = process.env.FIXITNOW_TEST_TECH_FILE;
const customerFile = process.env.FIXITNOW_TEST_CUSTOMER_FILE;
if (!technicianFile || !customerFile) throw new Error("Set generated technician and customer fixture paths");
const technician = JSON.parse(readFileSync(technicianFile, "utf8"));
const customer = JSON.parse(readFileSync(customerFile, "utf8"));
const backendEnv = Object.fromEntries(readFileSync(resolve(backendDirectory, ".env"), "utf8").split(/\r?\n/).filter((line) => line.includes("=") && !line.startsWith("#")).map((line) => {
  const divider = line.indexOf("=");
  return [line.slice(0, divider), line.slice(divider + 1).replace(/^['"]|['"]$/g, "")];
}));

async function availablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolvePort(address.port));
    });
  });
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(url)).status < 500) return; } catch {}
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }
  throw new Error("The local frontend/backend did not become ready");
}

const backendPort = await availablePort();
let frontendPort = await availablePort();
while (frontendPort === backendPort) frontendPort = await availablePort();
const backendUrl = `http://127.0.0.1:${backendPort}`;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const backendEnvironment = { ...process.env, ...backendEnv, PORT: String(backendPort), APP_URL: frontendUrl, SERVER_URL: backendUrl, NODE_ENV: "production" };
const frontendEnvironment = { ...process.env, API_BASE_URL: backendUrl, NODE_ENV: "production" };
for (const key of ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "ADMIN_PASSWORD", "DATABASE_URL"]) delete frontendEnvironment[key];
const backend = spawn(process.execPath, ["dist/server.js"], { cwd: backendDirectory, env: backendEnvironment, stdio: "ignore" });
const frontend = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(frontendPort)], { cwd: frontendDirectory, env: frontendEnvironment, stdio: "ignore" });
let browser;
let technicianToken;
let customerToken;
let slots = [];
let activeBookingId;

async function api(method, path, body, token) {
  const response = await fetch(backendUrl + path, { method, headers: { ...(body ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  return { status: response.status, data: data.data };
}

async function login(page, email, password, role) {
  await page.goto(`${frontendUrl}/auth/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(`**/dashboard/${role}`);
}

try {
  await Promise.all([waitFor(`${backendUrl}/api/categories`), waitFor(`${frontendUrl}/auth/login`)]);
  const technicianLogin = await api("POST", "/api/auth/login", { email: technician.email, password: technician.password });
  const customerLogin = await api("POST", "/api/auth/login", { email: customer.customerEmail, password: customer.customerPassword });
  assert.equal(technicianLogin.status, 200);
  assert.equal(customerLogin.status, 200);
  technicianToken = technicianLogin.data.accessToken;
  customerToken = customerLogin.data.accessToken;
  assert.equal((await api("PATCH", `/api/technician/services/${technician.serviceId}`, { isActive: true }, technicianToken)).status, 200);

  const firstStart = new Date(Date.now() + 100 * 86400000);
  const secondStart = new Date(Date.now() + 101 * 86400000);
  const interval = (start) => ({ startAt: start.toISOString(), endAt: new Date(start.getTime() + 3600000).toISOString() });
  const availability = await api("PUT", "/api/technician/availability", { slots: [interval(firstStart), interval(secondStart)] }, technicianToken);
  assert.equal(availability.status, 200);
  slots = [firstStart, secondStart].map((start) => availability.data.find((slot) => new Date(slot.startAt).getTime() === start.getTime())?.id);
  assert.equal(slots.every(Boolean), true);

  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await login(page, customer.customerEmail, customer.customerPassword, "customer");
  await page.goto(`${frontendUrl}/technicians/${technician.profileId}`);
  await page.getByRole("button", { name: "Request booking" }).waitFor();
  await page.getByRole("button", { name: "Request booking" }).click();
  assert.equal(await page.locator("#booking-slot").getAttribute("aria-invalid"), "true");
  await page.locator("#booking-slot").selectOption(slots[0]);
  await page.route("**/api/customer/bookings", async (route) => {
    if (route.request().method() === "POST") {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 350));
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Test booking outage" }) });
    } else await route.continue();
  });
  const failed = page.waitForResponse((response) => response.url().endsWith("/api/customer/bookings") && response.request().method() === "POST" && response.status() === 503);
  await page.getByRole("button", { name: "Request booking" }).click();
  await page.getByRole("button", { name: "Sending request" }).waitFor();
  const pendingDisabled = await page.getByRole("button", { name: "Sending request" }).isDisabled();
  await failed;
  await page.getByText("Test booking outage").waitFor();
  await page.unroute("**/api/customer/bookings");

  const first = page.waitForResponse((response) => response.url().endsWith("/api/customer/bookings") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Request booking" }).click();
  const firstResponse = await first;
  assert.equal(firstResponse.status(), 201);
  activeBookingId = (await firstResponse.json()).id;
  await page.waitForURL("**/dashboard/customer");
  const requested = page.getByRole("row").filter({ hasText: "Integration Check 5aafbb653691" }).filter({ hasText: "REQUESTED" });
  await requested.getByRole("button", { name: "Cancel" }).waitFor();
  const cancellation = page.waitForResponse((response) => response.url().includes(`/api/customer/bookings/${activeBookingId}/cancel`) && response.request().method() === "PATCH");
  await requested.getByRole("button", { name: "Cancel" }).click();
  const cancelStatus = (await cancellation).status();
  activeBookingId = undefined;

  await page.goto(`${frontendUrl}/technicians/${technician.profileId}`);
  await page.getByRole("button", { name: "Request booking" }).waitFor();
  await page.locator("#booking-slot").selectOption(slots[1]);
  const second = page.waitForResponse((response) => response.url().endsWith("/api/customer/bookings") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Request booking" }).click();
  const secondResponse = await second;
  assert.equal(secondResponse.status(), 201);
  activeBookingId = (await secondResponse.json()).id;
  await login(page, technician.email, technician.password, "technician");
  await page.goto(`${frontendUrl}/dashboard/technician/bookings`);
  const pending = page.getByRole("row").filter({ hasText: "Integration Check 5aafbb653691" }).filter({ hasText: "REQUESTED" });
  await pending.getByRole("button", { name: "Decline" }).waitFor();
  const decline = page.waitForResponse((response) => response.url().includes(`/api/technician/bookings/${activeBookingId}`) && response.request().method() === "PATCH");
  await pending.getByRole("button", { name: "Decline" }).click();
  const declineStatus = (await decline).status();
  const duplicateStatus = (await api("PATCH", `/api/technician/bookings/${activeBookingId}`, { status: "DECLINED" }, technicianToken)).status;
  activeBookingId = undefined;
  console.log(JSON.stringify({ invalidField: true, pendingDisabled, bookingCreated: firstResponse.status(), cancelStatus, secondBookingCreated: secondResponse.status(), declineStatus, duplicateDecline: duplicateStatus }));
  await page.close();
} finally {
  if (activeBookingId && customerToken) await api("PATCH", `/api/bookings/${activeBookingId}/cancel`, undefined, customerToken).catch(() => {});
  if (technicianToken) {
    await api("PATCH", `/api/technician/services/${technician.serviceId}`, { isActive: false }, technicianToken).catch(() => {});
    for (const id of slots) if (id) await api("PATCH", `/api/technician/availability/${id}/block`, undefined, technicianToken).catch(() => {});
  }
  if (browser) await browser.close();
  backend.kill();
  frontend.kill();
}
