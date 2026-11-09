import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createServer as createHttpServer } from "node:http";
import { chromium } from "playwright-core";

const availablePort = () => new Promise((resolve, reject) => {
  const server = createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    server.close(() => resolve(address.port));
  });
});

const backendPort = await availablePort();
const frontendPort = await availablePort();
const base = `http://127.0.0.1:${frontendPort}`;
const profileId = "33333333-3333-4333-8333-333333333333";
const chosenService = "44444444-4444-4444-8444-444444444444";
const otherService = "55555555-5555-4555-8555-555555555555";
const openSlot = "66666666-6666-4666-8666-666666666666";
const bookedSlot = "77777777-7777-4777-8777-777777777777";
const completedBooking = "88888888-8888-4888-8888-888888888888";
const startAt = new Date(Date.now() + 7 * 86400000).toISOString();
const endAt = new Date(new Date(startAt).getTime() + 2 * 3600000).toISOString();
const bookings = [];
const profile = {
  id: profileId, bio: "Home repair", skills: ["Repair"], experienceYears: 4, location: "Dhaka", profilePhoto: null,
  user: { name: "Technician One" }, averageRating: 4.5, reviewCount: 0, reviews: [],
  services: [
    { id: otherService, title: "Other service", price: "100", durationMinutes: 60, category: { id: "cat", name: "Repairs" } },
    { id: chosenService, title: "Chosen service", price: "200", durationMinutes: 60, category: { id: "cat", name: "Repairs" } },
  ],
  availabilitySlots: [
    { id: openSlot, startAt, endAt, isActive: true, bookings: [] },
    { id: bookedSlot, startAt: new Date(new Date(startAt).getTime() + 3 * 3600000).toISOString(), endAt: new Date(new Date(startAt).getTime() + 5 * 3600000).toISOString(), isActive: false, bookings: [{ status: "REQUESTED" }] },
  ],
};
const send = (response, status, data) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(data));
};
const backend = createHttpServer((request, response) => {
  if (request.url === `/api/technicians/${profileId}`) return send(response, 200, { data: profile });
  if (request.url === "/api/auth/me") return send(response, 200, { data: { name: "Customer", role: "CUSTOMER" } });
  if (request.url === `/api/bookings/${completedBooking}`) return send(response, 200, { data: { id: completedBooking, status: "COMPLETED", service: { title: "Chosen service" } } });
  if (request.url === "/api/bookings" && request.method === "POST") {
    let body = "";
    request.on("data", (part) => { body += part; });
    request.on("end", () => { bookings.push(JSON.parse(body)); send(response, 201, { data: { id: "booking-1" } }); });
    return;
  }
  send(response, 404, { message: "Not found" });
});
await new Promise((resolve) => backend.listen(backendPort, "127.0.0.1", resolve));
const frontend = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(frontendPort)], {
  cwd: process.cwd(), env: { ...process.env, API_BASE_URL: `http://127.0.0.1:${backendPort}`, NEXT_TELEMETRY_DISABLED: "1" }, stdio: "ignore",
});
let browser;
try {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`${base}/auth/login`)).status === 200) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext();
  await context.addCookies([{ name: "accessToken", value: "valid-customer", url: base }]);
  const page = await context.newPage();
  await page.goto(`${base}/technicians/${profileId}?serviceId=${chosenService}`);
  await page.getByRole("heading", { name: "Request a booking" }).waitFor();
  const profileBack = page.getByRole("link", { name: "Back to services" });
  assert.equal(await profileBack.getAttribute("href"), "/services");
  assert.equal(await profileBack.evaluate((element) => getComputedStyle(element).color), "rgb(154, 230, 0)");
  assert.equal(await profileBack.locator("svg").evaluate((element) => getComputedStyle(element).color), "rgb(154, 230, 0)");
  const profileBreadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
  await profileBreadcrumb.waitFor();
  assert.equal(await profileBreadcrumb.count(), 1);
  assert.equal(await profileBreadcrumb.getByRole("link", { name: "Services & Technicians" }).getAttribute("href"), "/services");
  const serviceCard = page.getByRole("heading", { name: "Services and prices" }).locator("..").locator("div.rounded-lg.border").first();
  assert.equal(await serviceCard.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("combobox", { name: "Service" }).getByText("Chosen service").waitFor();
  const booked = page.getByRole("button", { name: /Booked/ });
  await booked.waitFor();
  assert.equal(await booked.isDisabled(), true);
  const available = page.getByRole("button", { name: /Available/ });
  assert.equal(await available.count(), 1);
  await available.click();
  await page.getByRole("button", { name: "Request booking" }).click();
  await page.waitForURL("**/dashboard/customer");
  assert.deepEqual(bookings, [{ serviceId: chosenService, availabilitySlotId: openSlot }]);
  await page.goto(`${base}/auth/register`);
  await page.getByRole("navigation", { name: "breadcrumb" }).getByText("Create account").waitFor();
  assert.equal(await page.locator("footer").count(), 1);
  const accountType = page.getByRole("combobox", { name: "Account type" });
  await accountType.click();
  await page.getByRole("option", { name: "Technician" }).click();
  await accountType.getByText("Technician").waitFor();
  await page.route(`**/api/customer/bookings/${completedBooking}`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });
  await page.goto(`${base}/dashboard/customer/bookings/${completedBooking}/review`);
  const reviewBack = page.getByRole("link", { name: "Back to bookings" });
  assert.equal(await reviewBack.getAttribute("href"), "/dashboard/customer");
  assert.equal(await reviewBack.evaluate((element) => getComputedStyle(element).backgroundColor), "rgba(0, 0, 0, 0)");
  assert.equal(await page.getByRole("navigation", { name: "breadcrumb" }).getByRole("link", { name: "Customer workspace" }).getAttribute("href"), "/dashboard/customer");
  await page.getByRole("status", { name: "Loading booking" }).waitFor();
  const rating = page.getByRole("combobox", { name: "Rating" });
  await rating.waitFor();
  await page.unroute(`**/api/customer/bookings/${completedBooking}`);
  await rating.click();
  await page.getByRole("option", { name: "4 stars" }).click();
  await rating.getByText("4 stars").waitFor();
  await page.goto(`${base}/dashboard/customer/bookings/99999999-9999-4999-8999-999999999999/review`);
  await page.getByText("Booking unavailable").waitFor();
  console.log("PASS booking slots, controls, and review loading/error states");
} finally {
  await browser?.close();
  if (frontend.exitCode === null) frontend.kill();
  await new Promise((resolve) => backend.close(resolve));
}
