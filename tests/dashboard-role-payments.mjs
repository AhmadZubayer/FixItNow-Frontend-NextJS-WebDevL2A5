import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createServer as createHttpServer } from "node:http";
import { chromium } from "playwright-core";

const node = process.execPath;

const availablePort = () => new Promise((resolve, reject) => {
  const server = createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    server.close(() => resolve(address.port));
  });
});

const backendPort = await availablePort();
let frontendPort = await availablePort();
while (frontendPort === backendPort) frontendPort = await availablePort();
const users = Array.from({ length: 12 }, (_, index) => ({
  id: `55555555-5555-4555-8555-${String(index + 1).padStart(12, "0")}`,
  name: `Technician ${index + 1}`,
  email: `technician${index + 1}@example.test`,
  role: "TECHNICIAN",
  activeStatus: "ACTIVE",
  createdAt: "2026-01-01T00:00:00.000Z",
}));

const send = (response, status, data) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(data));
};

const backend = createHttpServer((request, response) => {
  const token = request.headers.authorization?.replace("Bearer ", "");
  const role = token?.startsWith("valid-") ? token.slice(6).toUpperCase() : null;

  if (request.url === "/api/auth/refresh-token" && request.method === "POST") {
    request.resume();
    send(response, 200, { data: { accessToken: "valid-admin" } });
  } else if (request.url === "/api/auth/me" && role) {
    send(response, 200, { data: { name: "Test user", role } });
  } else if (request.url === "/api/admin/payments" && role === "ADMIN") {
    send(response, 200, { data: [{
      id: "payment-1", amount: "100.00", method: "Card", provider: "STRIPE", status: "COMPLETED",
      paidAt: "2026-01-01T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z",
      technicianReceived: "85.00", platformEarning: "15.00",
      booking: { customer: { name: "Customer One" }, service: { title: "Fan Repair", technicianProfile: { user: { name: "Technician One" } } } },
    }] });
  } else if (request.url === "/api/admin/payments" && role) {
    send(response, 403, { message: "Forbidden" });
  } else if (request.url === "/api/admin/users" && role === "ADMIN") {
    send(response, 200, { data: users });
  } else if (request.url === "/api/admin/bookings" && role === "ADMIN") {
    send(response, 200, { data: [] });
  } else if (request.url === "/api/admin/categories" && role === "ADMIN") {
    send(response, 200, { data: [{ id: "11111111-1111-4111-8111-111111111111", name: "Electrical", slug: "electrical", description: "Electrical work", isActive: true }] });
  } else if (request.url?.startsWith("/api/admin/users/") && request.method === "PATCH" && role === "ADMIN") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      const user = users.find((item) => item.id === request.url.split("/").at(-1));
      if (!user) return send(response, 404, { message: "Not found" });
      user.activeStatus = JSON.parse(body).activeStatus;
      send(response, 200, { data: user });
    });
  } else if (request.url?.startsWith("/api/admin/users") && role) {
    send(response, 403, { message: "Forbidden" });
  } else {
    send(response, 401, { message: "Please log in" });
  }
});

await new Promise((resolve) => backend.listen(backendPort, "127.0.0.1", resolve));
const frontend = spawn(node, ["node_modules/next/dist/bin/next", "start", "-p", String(frontendPort)], {
  cwd: process.cwd(),
  env: { ...process.env, API_BASE_URL: `http://127.0.0.1:${backendPort}`, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: "ignore",
});
const base = `http://127.0.0.1:${frontendPort}`;

const waitForFrontend = async () => {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(`${base}/auth/login`)).status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Frontend did not become ready");
};

const dashboard = (path, cookie) => fetch(`${base}${path}`, {
  headers: cookie ? { cookie } : {},
  redirect: "manual",
});
let browser;

try {
  await waitForFrontend();

  const anonymous = await dashboard("/dashboard/admin/payments");
  assert.equal(anonymous.status, 307);
  assert.equal(new URL(anonymous.headers.get("location"), base).pathname, "/auth/login");

  for (const role of ["admin", "customer", "technician"]) {
    const own = await dashboard(`/dashboard/${role}`, `accessToken=valid-${role}`);
    assert.equal(own.status, 200, `${role} should access its dashboard`);

    const other = role === "admin" ? "customer" : "admin";
    const wrong = await dashboard(`/dashboard/${other}`, `accessToken=valid-${role}`);
    assert.equal(wrong.status, 307, `${role} should be redirected from ${other}`);
    assert.equal(new URL(wrong.headers.get("location"), base).pathname, `/dashboard/${role}`);
  }

  const refreshed = await dashboard("/dashboard/admin/payments", "refreshToken=valid-refresh");
  assert.equal(refreshed.status, 200);
  assert.match(refreshed.headers.get("set-cookie") ?? "", /accessToken=valid-admin/);

  const adminPayments = await dashboard("/api/admin/payments", "accessToken=valid-admin");
  assert.equal(adminPayments.status, 200);
  assert.equal((await adminPayments.json())[0].id, "payment-1");

  const customerPayments = await dashboard("/api/admin/payments", "accessToken=valid-customer");
  assert.equal(customerPayments.status, 403);
  const customerTechnicians = await dashboard("/dashboard/admin/technicians", "accessToken=valid-customer");
  assert.equal(customerTechnicians.status, 307);

  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext();
  await context.addCookies([{ name: "accessToken", value: "valid-admin", url: base }]);
  const page = await context.newPage();
  await page.goto(`${base}/dashboard/admin/technicians`);
  await page.getByRole("heading", { name: "Technician management" }).waitFor();
  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.setViewportSize({ width: 1280, height: 800 });
  const rows = page.locator("tbody tr");
  await rows.first().waitFor();
  assert.equal(await rows.count(), 10);
  await page.getByRole("button", { name: "Next" }).click();
  assert.equal(await rows.count(), 2);
  await page.getByLabel("Search technicians").fill("Technician 12");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  assert.equal(await rows.count(), 1);
  await page.getByRole("button", { name: "Ban", exact: true }).click();
  await page.getByText("Banned", { exact: true }).waitFor();
  assert.equal(users[11].activeStatus, "BLOCKED");

  await page.goto(`${base}/dashboard/admin/payments`);
  await page.getByRole("heading", { name: "Platform payment history" }).waitFor();
  await page.getByRole("cell", { name: "৳85.00" }).waitFor();
  await page.getByRole("cell", { name: "৳15.00" }).waitFor();
  await page.goto(`${base}/dashboard/admin`);
  await page.getByRole("heading", { name: "Categories" }).waitFor();
  const overviewCard = page.locator('section[aria-label="Platform overview"] > div').first();
  assert.equal(await overviewCard.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  await page.getByRole("button", { name: "Edit" }).click();
  const active = page.getByRole("checkbox", { name: "Active" });
  await active.waitFor();
  assert.equal(await active.isChecked(), true);
  await active.click();
  assert.equal(await active.isChecked(), false);
  console.log("PASS dashboard roles, admin views, and category checkbox");
} finally {
  await browser?.close();
  if (frontend.exitCode === null) {
    frontend.kill();
    await new Promise((resolve) => frontend.once("exit", resolve));
  }
  await new Promise((resolve) => backend.close(resolve));
}
