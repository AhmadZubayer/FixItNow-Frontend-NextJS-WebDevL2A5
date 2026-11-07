import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

if (process.env.FIXITNOW_PAYMENT_MUTATION_TESTS !== "1") throw new Error("Set FIXITNOW_PAYMENT_MUTATION_TESTS=1 for a real test-mode Checkout");
const frontendDirectory = process.cwd();
const backendDirectory = resolve(frontendDirectory, "../FixItNow-backend-server");
const technician = JSON.parse(readFileSync(process.env.FIXITNOW_TEST_TECH_FILE, "utf8"));
const customer = JSON.parse(readFileSync(process.env.FIXITNOW_TEST_CUSTOMER_FILE, "utf8"));
const backendEnv = Object.fromEntries(readFileSync(resolve(backendDirectory, ".env"), "utf8").split(/\r?\n/).filter((line) => line.includes("=") && !line.startsWith("#")).map((line) => {
  const divider = line.indexOf("=");
  return [line.slice(0, divider), line.slice(divider + 1).replace(/^['"]|['"]$/g, "")];
}));
if (!backendEnv.STRIPE_SECRET_KEY?.startsWith("sk_test_")) throw new Error("Backend Stripe test mode is required");
const requireBackend = createRequire(resolve(backendDirectory, "package.json"));
const Stripe = requireBackend("stripe");
const stripe = new Stripe(backendEnv.STRIPE_SECRET_KEY);

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
let bookingId;
let slotId;
let sessionId;

async function api(method, path, body, token) {
  const response = await fetch(backendUrl + path, { method, headers: { ...(body ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  return { status: response.status, data: data.data };
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
  const start = new Date(Date.now() + 130 * 86400000);
  const availability = await api("PUT", "/api/technician/availability", { slots: [{ startAt: start.toISOString(), endAt: new Date(start.getTime() + 3600000).toISOString() }] }, technicianToken);
  assert.equal(availability.status, 200);
  slotId = availability.data.find((slot) => new Date(slot.startAt).getTime() === start.getTime())?.id;
  assert.ok(slotId);
  const booking = await api("POST", "/api/bookings", { serviceId: technician.serviceId, availabilitySlotId: slotId }, customerToken);
  assert.equal(booking.status, 201);
  bookingId = booking.data.id;
  assert.equal((await api("PATCH", `/api/technician/bookings/${bookingId}`, { status: "ACCEPTED" }, technicianToken)).status, 200);

  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(`${frontendUrl}/auth/login`);
  await page.getByLabel("Email").fill(customer.customerEmail);
  await page.getByLabel("Password").fill(customer.customerPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/dashboard/customer");
  await page.goto(`${frontendUrl}/dashboard/customer/bookings/invalid/pay`);
  await page.getByText("We could not load this booking.").waitFor();
  await page.goto(`${frontendUrl}/dashboard/customer/bookings/${bookingId}/pay`);
  await page.getByRole("button", { name: "Continue to Stripe" }).waitFor();
  await page.route("**/api/customer/payments", async (route) => {
    if (route.request().method() === "POST") {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 350));
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Test checkout outage" }) });
    } else await route.continue();
  });
  const failed = page.waitForResponse((response) => response.url().endsWith("/api/customer/payments") && response.request().method() === "POST" && response.status() === 503);
  await page.getByRole("button", { name: "Continue to Stripe" }).click();
  await page.getByRole("button", { name: "Opening Stripe Checkout" }).waitFor();
  const pendingDisabled = await page.getByRole("button", { name: "Opening Stripe Checkout" }).isDisabled();
  await failed;
  await page.getByText("Test checkout outage").waitFor();
  await page.unroute("**/api/customer/payments");
  await page.route("https://checkout.stripe.com/**", (route) => route.abort());
  let finishCreation;
  const created = new Promise((resolveCreation) => { finishCreation = resolveCreation; });
  await page.route("**/api/customer/payments", async (route) => {
    if (route.request().method() !== "POST") { await route.continue(); return; }
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ response });
    finishCreation({ status: response.status(), body });
  });
  await page.getByRole("button", { name: "Continue to Stripe" }).click();
  const createdResponse = await created;
  assert.equal(createdResponse.status, 201);
  const checkout = createdResponse.body;
  sessionId = checkout.checkoutUrl.match(/cs_test_[A-Za-z0-9]+/)?.[0];
  assert.ok(sessionId);
  const duplicate = await api("POST", "/api/payments/create", { bookingId, provider: "STRIPE" }, customerToken);
  assert.equal(duplicate.status, 409);
  console.log(JSON.stringify({ invalidBookingRejected: true, pendingDisabled, apiErrorShown: true, checkoutCreated: createdResponse.status, duplicateCheckout: 409 }));
  await page.close();
} finally {
  if (sessionId) {
    const expired = await stripe.checkout.sessions.expire(sessionId).catch(() => null);
    if (expired && backendEnv.STRIPE_WEBHOOK_SECRET) {
      const event = { id: `evt_test_cleanup_${Date.now()}`, object: "event", type: "checkout.session.expired", data: { object: expired }, livemode: false, created: Math.floor(Date.now() / 1000) };
      const payload = JSON.stringify(event);
      const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: backendEnv.STRIPE_WEBHOOK_SECRET });
      await fetch(`${backendUrl}/api/payments/webhook`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": signature }, body: payload }).catch(() => {});
    }
  }
  if (bookingId && customerToken) await api("PATCH", `/api/bookings/${bookingId}/cancel`, undefined, customerToken).catch(() => {});
  if (technicianToken) {
    await api("PATCH", `/api/technician/services/${technician.serviceId}`, { isActive: false }, technicianToken).catch(() => {});
    if (slotId) await api("PATCH", `/api/technician/availability/${slotId}/block`, undefined, technicianToken).catch(() => {});
  }
  if (browser) await browser.close();
  backend.kill();
  frontend.kill();
}
