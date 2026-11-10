import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

const bookingId = "11111111-1111-4111-8111-111111111111";
const booking = {
  id: bookingId, status: "ACCEPTED", priceAtBooking: "300.00",
  createdAt: "2026-11-10T06:00:00Z", updatedAt: "2026-11-10T07:00:00Z",
  startAt: "2026-11-12T03:00:00Z", endAt: "2026-11-12T04:15:00Z",
  items: [
    { serviceId: "fan", title: "Fan Repair", price: "100.00", durationMinutes: 30 },
    { serviceId: "socket", title: "Socket Repair", price: "200.00", durationMinutes: 45 },
  ],
  service: { title: "Fan Repair", durationMinutes: 30, technicianProfile: { id: "tech", user: { name: "Arif Hossain" } } },
};
let detailStatus = "ACCEPTED";
let detailUnavailable = false;
let paymentMode = "failure";
let paymentRequests = 0;
let heldPayment;
let paymentStarted;
const send = (response, status, body) => { response.writeHead(status, { "content-type": "application/json" }); response.end(JSON.stringify(body)); };
const backend = createServer((request, response) => {
  if (request.url === "/health") return send(response, 200, { success: true });
  if (request.headers.authorization !== "Bearer valid-customer") return send(response, 401, { message: "Unauthorized" });
  if (request.url === "/api/auth/me") return send(response, 200, { data: { name: "Customer", role: "CUSTOMER" } });
  if (request.url === "/api/bookings") return send(response, 200, { data: [booking] });
  if (request.url === "/api/payments") return send(response, 200, { data: [] });
  if (request.url === `/api/bookings/${bookingId}`) return send(response, detailUnavailable ? 503 : 200, detailUnavailable ? { message: "Unavailable" } : { data: { ...booking, status: detailStatus } });
  if (request.url === "/api/payments/create" && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      paymentRequests++;
      assert.deepEqual(JSON.parse(body), { bookingId, provider: "STRIPE" });
      if (paymentMode === "failure") return send(response, 409, { message: "A payment is already in progress for this booking" });
      if (paymentMode === "invalid-url") return send(response, 201, { data: { checkoutUrl: "https://example.com/payment" } });
      heldPayment = response;
      paymentStarted?.();
    });
    return;
  }
  send(response, 404, { message: "Not found" });
});
await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
const portServer = createServer();
await new Promise((resolve) => portServer.listen(0, "127.0.0.1", resolve));
const frontendPort = portServer.address().port;
await new Promise((resolve) => portServer.close(resolve));
const base = `http://127.0.0.1:${frontendPort}`;
let logs = "";
const frontend = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(frontendPort)], {
  env: { ...process.env, API_BASE_URL: `http://127.0.0.1:${backend.address().port}`, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});
frontend.stdout.on("data", (data) => { logs += data; });
frontend.stderr.on("data", (data) => { logs += data; });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`${base}/api/session/me`)).status === 401) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, logs);
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addCookies([{ name: "accessToken", value: "valid-customer", url: base }]);
  const page = await context.newPage();
  await page.goto(`${base}/dashboard/customer`);
  await page.getByRole("button", { name: "Pay now", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Confirm booking payment" });
  await dialog.getByText("Arif Hossain", { exact: true }).waitFor();
  assert.equal(new URL(page.url()).pathname, "/dashboard/customer");
  assert.equal(paymentRequests, 0, "Opening a confirmation must not create a payment");
  assert.equal(await dialog.getByText("Fan Repair", { exact: true }).count(), 1);
  assert.equal(await dialog.getByText("Socket Repair", { exact: true }).count(), 1);
  await dialog.getByText("৳100.00", { exact: true }).waitFor();
  await dialog.getByText("৳200.00", { exact: true }).waitFor();
  assert.equal(await dialog.getByText("৳300.00", { exact: true }).count(), 2);
  assert.equal(await dialog.getByText("75 minutes", { exact: true }).count(), 1);
  assert.equal(await dialog.locator("time").count(), 2);
  const warning = dialog.getByText("If you don’t confirm payment within 24 hours, your booking request will be cancelled automatically.", { exact: true });
  assert.match(await warning.getAttribute("class"), /text-red-600/);
  await page.screenshot({ path: join(tmpdir(), "fixitnow-customer-payment-dialog.png") });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: /View details/ }).click();
  const details = page.getByRole("dialog", { name: "Booking details" });
  await details.getByRole("button", { name: "Pay now", exact: true }).click();
  await dialog.getByText("Arif Hossain", { exact: true }).waitFor();
  await details.waitFor({ state: "hidden" });
  await dialog.getByRole("button", { name: "Continue to Payment" }).click();
  await dialog.getByRole("alert").filter({ hasText: "A payment is already in progress" }).waitFor();
  assert.equal(new URL(page.url()).pathname, "/dashboard/customer");
  paymentMode = "invalid-url";
  await dialog.getByRole("button", { name: "Continue to Payment" }).click();
  await dialog.getByText("Could not continue to payment. Please try again.", { exact: true }).waitFor();
  assert.equal(new URL(page.url()).pathname, "/dashboard/customer");
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  detailStatus = "CANCELLED";
  await page.getByRole("button", { name: "Pay now", exact: true }).click();
  await dialog.getByText("This booking is cancelled and is no longer available for payment.", { exact: true }).waitFor();
  assert.equal(await dialog.getByRole("button", { name: "Continue to Payment" }).isDisabled(), true);
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  detailStatus = "ACCEPTED";
  detailUnavailable = true;
  await page.getByRole("button", { name: "Pay now", exact: true }).click();
  await dialog.getByText("Could not load the booking details. Please try again.", { exact: true }).waitFor();
  detailUnavailable = false;
  await dialog.getByRole("button", { name: "Retry" }).click();
  await dialog.getByText("Arif Hossain", { exact: true }).waitFor();
  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const box = await dialog.boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 375 && box.height <= 812);
  await page.screenshot({ path: join(tmpdir(), "fixitnow-customer-payment-dialog-mobile.png") });
  paymentMode = "hold";
  const started = new Promise((resolve) => { paymentStarted = resolve; });
  await page.route("https://checkout.stripe.com/**", (route) => route.fulfill({ status: 200, body: "Checkout" }));
  const before = paymentRequests;
  await dialog.getByRole("button", { name: "Continue to Payment" }).click();
  await started;
  assert.equal(await dialog.getByRole("button", { name: "Opening payment…" }).isDisabled(), true);
  assert.equal(paymentRequests, before + 1);
  send(heldPayment, 201, { data: { checkoutUrl: "https://checkout.stripe.com/c/pay/session" } });
  await page.waitForURL("https://checkout.stripe.com/c/pay/session");
  assert.equal(paymentRequests, before + 1);
  console.log("PASS payment dialog: both entry points, details, breakdown, warning, desktop/mobile, retry, stale booking, checkout errors, URL validation, and redirect");
} finally {
  await browser?.close();
  if (frontend.exitCode === null) { frontend.kill(); await new Promise((resolve) => frontend.once("exit", resolve)); }
  await new Promise((resolve) => backend.close(resolve));
}
