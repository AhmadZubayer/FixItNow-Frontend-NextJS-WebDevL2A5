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
let frontendPort = await availablePort();
while (frontendPort === backendPort) frontendPort = await availablePort();
const base = `http://127.0.0.1:${frontendPort}`;
const profileId = "33333333-3333-4333-8333-333333333333";
const chosenService = "44444444-4444-4444-8444-444444444444";
const otherService = "55555555-5555-4555-8555-555555555555";
const openSlot = "66666666-6666-4666-8666-666666666666";
const bookedSlot = "77777777-7777-4777-8777-777777777777";
const shortSlot = "99999999-9999-4999-8999-999999999999";
const completedBooking = "88888888-8888-4888-8888-888888888888";
const appointmentDay = new Date(Date.now() + 7 * 86400000);
appointmentDay.setUTCHours(3, 0, 0, 0);
const startAt = appointmentDay.toISOString();
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
    { id: shortSlot, startAt: new Date(new Date(startAt).getTime() + 6 * 3600000).toISOString(), endAt: new Date(new Date(startAt).getTime() + 7 * 3600000).toISOString(), isActive: true, bookings: [] },
  ],
};
const send = (response, status, data) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(data));
};
const backend = createHttpServer((request, response) => {
  if (request.url === `/api/technicians/${profileId}`) return send(response, 200, { data: profile });
  if (request.url === "/api/technicians/missing-id-404") return send(response, 404, { message: "Not found" });
  if (request.url === "/api/technicians/invalid-id-400") return send(response, 400, { message: "Invalid ID format" });
  if (request.url === "/api/technicians/error-id-500") return send(response, 500, { message: "Internal server error" });
  if (request.url === "/api/auth/me") {
    if (request.headers.authorization === "Bearer valid-technician") {
      return send(response, 200, { data: { name: "Technician User", role: "TECHNICIAN" } });
    }
    return send(response, 200, { data: { name: "Customer", role: "CUSTOMER" } });
  }
  if (request.url === `/api/bookings/${completedBooking}`) return send(response, 200, { data: { id: completedBooking, status: "COMPLETED", service: { title: "Chosen service" } } });
  if (request.url === "/api/bookings" && request.method === "GET") return send(response, 200, { data: [] });
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
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  await anonPage.goto(`${base}/technicians/${profileId}`);
  await anonPage.getByText("Log in as a customer to book.").waitFor();
  assert.equal(await anonPage.getByRole("link", { name: "Log in" }).getAttribute("href"), "/auth/login");

  // Verify missing technician (404)
  await anonPage.goto(`${base}/technicians/missing-id-404`);
  await anonPage.getByText("Technician or page not found").waitFor();
  assert.equal(await anonPage.getByRole("link", { name: "Back to services" }).getAttribute("href"), "/services");

  // Verify invalid technician ID format (400)
  await anonPage.goto(`${base}/technicians/invalid-id-400`);
  await anonPage.getByText("Technician or page not found").waitFor();

  // Verify API error boundary (500)
  await anonPage.goto(`${base}/technicians/error-id-500`);
  await anonPage.getByText("We could not load this technician profile").waitFor();
  assert.ok(await anonPage.getByRole("button", { name: "Try again" }).isVisible());

  await anonContext.close();

  const techContext = await browser.newContext();
  await techContext.addCookies([{ name: "accessToken", value: "valid-technician", url: base }]);
  const techPage = await techContext.newPage();
  await techPage.goto(`${base}/technicians/${profileId}`);
  await techPage.getByText("Only customers can request bookings.").waitFor();
  await techContext.close();

  const context = await browser.newContext();
  await context.addCookies([{ name: "accessToken", value: "valid-customer", url: base }]);
  const page = await context.newPage();
  await page.goto(`${base}/technicians/${profileId}?serviceId=${chosenService}`);
  await page.getByRole("heading", { name: "Request a booking" }).waitFor();
  const profileBack = page.getByRole("link", { name: "Back to services" });
  assert.equal(await profileBack.getAttribute("href"), "/services");
  assert.equal(await profileBack.evaluate((element) => getComputedStyle(element).color), "rgb(0, 0, 0)");
  assert.equal(await profileBack.locator("svg").evaluate((element) => getComputedStyle(element).color), "rgb(0, 0, 0)");
  assert.equal(await profileBack.evaluate((element) => getComputedStyle(element).textDecorationLine), "underline");
  assert.equal(await profileBack.evaluate((element) => getComputedStyle(element).backgroundColor), "rgba(0, 0, 0, 0)");
  const profileBreadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
  await profileBreadcrumb.waitFor();
  assert.equal(await profileBreadcrumb.count(), 1);
  assert.equal(await profileBreadcrumb.getByRole("link", { name: "Home" }).getAttribute("href"), "/");
  assert.equal(await profileBreadcrumb.getByRole("link", { name: "Services & Technicians" }).getAttribute("href"), "/services");
  await profileBreadcrumb.getByText("Technician profile").waitFor();
  const breadcrumbTop = await profileBreadcrumb.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const contentTop = await page.locator("main").evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  assert.ok(breadcrumbTop < contentTop, "Breadcrumbs must appear above profile content");
  const serviceCard = page.getByRole("button", { name: /^Other service/ });
  assert.equal(await serviceCard.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  const profileCard = page.locator("main div.rounded-xl.border.bg-card").first();
  assert.equal(await profileCard.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  const bookingCard = page.getByRole("heading", { name: "Book a service" }).locator("..").locator("div.rounded-xl.border.bg-card");
  assert.equal(await bookingCard.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  const footer = page.locator("footer");
  await footer.waitFor();
  assert.equal(await footer.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  const footerTop = await footer.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  assert.ok(contentTop < footerTop, "Footer must appear below profile content");

  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const leftCol = page.locator("h1").locator("xpath=ancestor::div[contains(@class, 'rounded-xl')][1]");
  const rightCol = page.getByRole("heading", { name: "Book a service" }).locator("xpath=ancestor::section[1]");
  const leftBoxMobile = await leftCol.evaluate((element) => element.getBoundingClientRect());
  const rightBoxMobile = await rightCol.evaluate((element) => element.getBoundingClientRect());
  assert.ok(leftBoxMobile.bottom <= rightBoxMobile.top + 50, "Columns must stack vertically on mobile");

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("heading", { name: "Customer reviews" }).waitFor();
  await page.getByRole("heading", { name: "Provided services" }).waitFor();
  await page.getByRole("heading", { name: "Book a service" }).waitFor();
  const leftBox = await leftCol.evaluate((element) => element.getBoundingClientRect());
  const rightBox = await rightCol.evaluate((element) => element.getBoundingClientRect());
  assert.ok(leftBox.right <= rightBox.left, "Left and right columns must be positioned side-by-side on desktop");
  const chosen = page.getByRole("button", { name: /^Chosen service/ });
  const other = page.getByRole("button", { name: /^Other service/ });
  await page.getByText("Selected services", { exact: true }).waitFor();
  assert.equal(await chosen.getAttribute("aria-pressed"), "true");
  assert.equal(await chosen.evaluate(element => getComputedStyle(element).borderColor), "rgb(154, 230, 0)");
  assert.equal(await page.locator("p.text-xl.font-bold, span.text-xl.font-bold").innerText(), "৳200");
  await other.hover();
  await page.waitForFunction(() => [...document.querySelectorAll('button[aria-pressed]')].some(
    element => element.textContent.includes("Other service") && getComputedStyle(element).backgroundColor === "rgb(154, 230, 0)"
  ));
  await other.click();
  assert.equal(await other.getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("p.text-xl.font-bold, span.text-xl.font-bold").innerText(), "৳300");
  assert.equal(await page.getByRole("button", { name: /Too short/ }).isDisabled(), true);
  await page.getByRole("button", { name: "Remove Other service", exact: true }).click();
  assert.equal(await page.locator("p.text-xl.font-bold, span.text-xl.font-bold").innerText(), "৳200");
  await other.click();
  const booked = page.getByRole("button", { name: /Booked/ });
  await booked.waitFor();
  assert.equal(await booked.isDisabled(), true);
  const available = page.getByRole("button", { name: /Available/ });
  assert.equal(await available.count(), 1);
  await available.click();
  await page.mouse.move(0, 0);
  assert.equal(await available.getAttribute("aria-pressed"), "true");
  assert.ok(await available.evaluate((element) => element.style.backgroundColor === "rgb(154, 230, 0)" || getComputedStyle(element).backgroundColor.includes("oklab") || getComputedStyle(element).backgroundColor.includes("154")), "Selected slot must have active green background");
  await page.getByRole("button", { name: "Book now" }).click();
  await page.waitForURL("**/dashboard/customer");
  assert.deepEqual(bookings, [{ serviceIds: [chosenService, otherService], availabilitySlotId: openSlot }]);
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
