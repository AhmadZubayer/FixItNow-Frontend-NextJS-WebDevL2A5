import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createServer as createHttpServer } from "node:http";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright-core";

const availablePort = () => new Promise((resolvePort, reject) => {
  const server = createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    server.close(() => resolvePort(address.port));
  });
});

const backendPort = await availablePort();
let frontendPort = await availablePort();
while (frontendPort === backendPort) frontendPort = await availablePort();
const base = `http://127.0.0.1:${frontendPort}`;
const categoryId = "11111111-1111-4111-8111-111111111111";
const plumbingId = "22222222-2222-4222-8222-222222222222";
const categories = [
  { id: categoryId, name: "Electrical", slug: "electrical" },
  { id: plumbingId, name: "Plumbing", slug: "plumbing" },
];
const technicians = Array.from({ length: 12 }, (_, index) => {
  const category = categories[index < 10 ? 0 : 1];
  const id = `33333333-3333-4333-8333-${String(index + 1).padStart(12, "0")}`;
  const serviceId = `44444444-4444-4444-8444-${String(index + 1).padStart(12, "0")}`;
  return {
    id, bio: `Home repair technician ${index + 1}`, skills: [category.name], experienceYears: 3,
    location: index < 10 ? "Dhaka" : "Chattogram", profilePhoto: null,
    user: { name: `Technician ${index + 1}` }, averageRating: 4.5, reviewCount: 2,
    services: [{ id: serviceId, title: index < 10 ? `Fan Repair ${index + 1}` : `Sink Repair ${index + 1}`, price: String(100 + index * 10), category }],
  };
});
const services = technicians.map((technician) => ({
  ...technician.services[0], description: `Repair by ${technician.user.name}`, durationMinutes: 60,
  technicianProfile: { id: technician.id, location: technician.location, user: technician.user, averageRating: technician.averageRating, reviewCount: technician.reviewCount },
}));
const observed = [];

const send = (response, data) => {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ data }));
};

const backend = createHttpServer((request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${backendPort}`);
  observed.push(url);
  if (url.pathname === "/api/categories") return send(response, categories);
  if (url.pathname === "/api/auth/me") {
    response.writeHead(401, { "content-type": "application/json" });
    response.end(JSON.stringify({ message: "Please log in" }));
    return;
  }
  if (url.pathname === "/api/services") {
    let matches = services.filter((service) => !url.searchParams.has("categoryId") || service.category.id === url.searchParams.get("categoryId"));
    if (url.searchParams.has("q")) matches = matches.filter((service) => service.title.toLowerCase().includes(url.searchParams.get("q").toLowerCase()));
    return send(response, matches);
  }
  if (url.pathname === "/api/technicians") {
    let matches = technicians.filter((technician) => !url.searchParams.has("categoryId") || technician.services[0].category.id === url.searchParams.get("categoryId"));
    if (url.searchParams.has("serviceId")) matches = matches.filter((technician) => technician.services[0].id === url.searchParams.get("serviceId"));
    if (url.searchParams.has("q")) matches = matches.filter((technician) => technician.services[0].title.toLowerCase().includes(url.searchParams.get("q").toLowerCase()));
    if (url.searchParams.has("location")) matches = matches.filter((technician) => technician.location.toLowerCase().includes(url.searchParams.get("location").toLowerCase()));
    if (url.searchParams.has("minPrice")) matches = matches.filter((technician) => Number(technician.services[0].price) >= Number(url.searchParams.get("minPrice")));
    if (url.searchParams.has("maxPrice")) matches = matches.filter((technician) => Number(technician.services[0].price) <= Number(url.searchParams.get("maxPrice")));
    if (url.searchParams.has("minRating")) matches = matches.filter((technician) => technician.averageRating >= Number(url.searchParams.get("minRating")));
    if (url.searchParams.get("priceSort") === "asc") matches.sort((a, b) => Number(a.services[0].price) - Number(b.services[0].price));
    if (url.searchParams.get("priceSort") === "desc") matches.sort((a, b) => Number(b.services[0].price) - Number(a.services[0].price));
    if (url.searchParams.get("ratingSort") === "asc") matches.sort((a, b) => a.averageRating - b.averageRating);
    if (url.searchParams.get("ratingSort") === "desc") matches.sort((a, b) => b.averageRating - a.averageRating);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 9);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ data: matches.slice((page - 1) * limit, page * limit), meta: { page, limit, total: matches.length } }));
    return;
  }
  response.writeHead(404).end();
});

await new Promise((resolveReady) => backend.listen(backendPort, "127.0.0.1", resolveReady));
const frontend = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(frontendPort)], {
  cwd: process.cwd(), env: { ...process.env, API_BASE_URL: `http://127.0.0.1:${backendPort}`, NEXT_TELEMETRY_DISABLED: "1" }, stdio: "ignore",
});
let browser;

try {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`${base}/auth/login`)).status === 200) break; } catch {}
    if (attempt === 59) throw new Error("Frontend did not become ready");
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto(`${base}/services`);
  const logo = page.locator('header a[href="/"]').first();
  assert.equal((await logo.innerText()).trim(), "FixItNow");
  assert.equal(await logo.getAttribute("href"), "/");
  assert((await logo.boundingBox()).x < (await page.getByRole("navigation", { name: "Main navigation" }).boundingBox()).x);
  const mainNavigation = page.getByRole("navigation", { name: "Main navigation" });
  assert.equal(await mainNavigation.getByRole("link", { name: "Services & Technicians" }).getAttribute("href"), "/services");
  assert.equal(await mainNavigation.getByRole("link", { name: "Dashboard" }).count(), 0);
  const headerBounds = await page.locator("header").boundingBox();
  const navigationBounds = await mainNavigation.boundingBox();
  assert(Math.abs(navigationBounds.x + navigationBounds.width / 2 - (headerBounds.x + headerBounds.width / 2)) < 2);
  const pageTitle = page.getByRole("heading", { name: "Technicians", level: 1 });
  const searchField = page.getByLabel("Search services or technicians");
  assert(Math.abs((await pageTitle.boundingBox()).y - (await searchField.boundingBox()).y) < 35);
  const back = page.getByRole("link", { name: "Back", exact: true });
  assert.equal(await back.getAttribute("href"), "/");
  assert.equal(await back.evaluate((element) => getComputedStyle(element).color), "rgb(154, 230, 0)");
  assert.equal(await back.evaluate((element) => getComputedStyle(element).backgroundColor), "rgba(0, 0, 0, 0)");
  const breadcrumbs = page.getByRole("navigation", { name: "breadcrumb" });
  await breadcrumbs.waitFor();
  assert.equal(await breadcrumbs.count(), 1);
  assert.equal(await breadcrumbs.getByRole("link", { name: "Home" }).getAttribute("href"), "/");
  assert.equal(await page.locator("footer").count(), 1);
  assert.equal(await page.locator("footer").evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  const technicianCards = page.locator("section[aria-labelledby='technician-results'] a[href^='/technicians/']");
  await technicianCards.first().waitFor();
  const pageBackground = await page.locator("main").evaluate((element) => getComputedStyle(element).backgroundColor);
  assert.equal(pageBackground, "rgb(255, 255, 255)");
  assert.equal(await technicianCards.first().evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  assert.equal(await page.locator('[data-slot="card"]').first().evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  const firstServiceCard = page.locator("section[aria-labelledby='service-results'] [data-slot='card']").first();
  assert((await firstServiceCard.boundingBox()).height >= 200);
  assert.equal(await firstServiceCard.getByText("Show technicians").evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(154, 230, 0)");
  await firstServiceCard.hover();
  await page.waitForFunction(() => getComputedStyle(document.querySelector("section[aria-labelledby='service-results'] [data-slot='card']")).borderTopColor === "rgb(0, 0, 0)");
  assert.equal(await firstServiceCard.evaluate((element) => getComputedStyle(element).borderTopColor), "rgb(0, 0, 0)");
  await technicianCards.first().hover();
  await page.waitForFunction(() => getComputedStyle(document.querySelector("section[aria-labelledby='technician-results'] a[href^='/technicians/']")).borderTopColor === "rgb(0, 0, 0)");
  assert.equal(await technicianCards.first().evaluate((element) => getComputedStyle(element).borderTopColor), "rgb(0, 0, 0)");
  assert.equal(await technicianCards.count(), 9);
  await page.getByRole("button", { name: "Go to next page" }).click();
  await page.waitForURL("**/services?page=2");
  assert.equal(await technicianCards.count(), 3);

  await page.getByLabel("Search services or technicians").fill("Fan");
  await page.getByLabel("Search services or technicians").press("Enter");
  await page.waitForURL("**/services?q=Fan");
  assert.equal(await technicianCards.count(), 9);
  assert(observed.some((url) => url.pathname === "/api/technicians" && url.searchParams.get("q") === "Fan" && url.searchParams.get("page") === "1"));
  assert(observed.some((url) => url.pathname === "/api/services" && url.searchParams.get("q") === "Fan"));

  await page.getByLabel("Price", { exact: true }).click();
  await page.getByRole("option", { name: "High to low" }).click();
  await page.waitForURL("**priceSort=desc*");
  assert(observed.some((url) => url.pathname === "/api/technicians" && url.searchParams.get("priceSort") === "desc"));

  await page.getByLabel("Rating", { exact: true }).click();
  await page.getByRole("option", { name: "High to low" }).click();
  await page.waitForURL("**ratingSort=desc*");
  assert(observed.some((url) => url.pathname === "/api/technicians" && url.searchParams.get("ratingSort") === "desc"));

  await page.getByRole("link", { name: /Fan Repair 1/ }).first().click();
  await page.waitForURL("**serviceId=44444444-4444-4444-8444-000000000001*");
  assert.equal(await technicianCards.count(), 1);
  assert(observed.some((url) => url.pathname === "/api/technicians" && url.searchParams.get("serviceId") === "44444444-4444-4444-8444-000000000001" && url.searchParams.get("q") === "Fan" && url.searchParams.get("priceSort") === "desc"));
  assert.equal(await page.getByText("Showing technicians for the selected service.").count(), 1);

  await page.getByRole("navigation", { name: "Filter by category" }).getByRole("link", { name: "Electrical" }).click();
  await page.waitForURL((url) => url.searchParams.get("categoryId") === categoryId && !url.searchParams.has("serviceId") && !url.searchParams.has("page"));
  assert.equal(await technicianCards.count(), 9);

  await page.getByLabel("Location").fill("Dhaka");
  await page.waitForURL((url) => url.searchParams.get("location") === "Dhaka");
  await page.getByLabel("Minimum price").fill("150");
  await page.waitForURL((url) => url.searchParams.get("minPrice") === "150");
  assert.equal(await technicianCards.count(), 5);
  assert(observed.some((url) => url.pathname === "/api/technicians" &&
    url.searchParams.get("q") === "Fan" && url.searchParams.get("categoryId") === categoryId &&
    url.searchParams.get("location") === "Dhaka" && url.searchParams.get("minPrice") === "150" &&
    url.searchParams.get("priceSort") === "desc" && url.searchParams.get("page") === "1" && url.searchParams.get("limit") === "9"));
  assert.equal(await page.getByLabel("Price", { exact: true }).innerText(), "High to low");

  await page.getByLabel("Minimum rating").click();
  await page.getByRole("option", { name: "4+ stars" }).click();
  await page.waitForURL((url) => url.searchParams.get("minRating") === "4");
  assert(observed.some((url) => url.pathname === "/api/technicians" && url.searchParams.get("minRating") === "4"));

  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.waitForURL((url) => !url.searchParams.has("q") && !url.searchParams.has("minPrice") && !url.searchParams.has("minRating"));
  assert.equal(await technicianCards.count(), 9);

  await page.screenshot({ path: resolve(tmpdir(), "fixitnow-services-current.png"), fullPage: true });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  assert.equal(await page.locator("header").evaluate((element) => Math.round(element.getBoundingClientRect().top)), 0);
  const headerStyle = await page.locator("header").evaluate((element) => ({ background: getComputedStyle(element).backgroundColor, blur: getComputedStyle(element).backdropFilter }));
  assert.match(headerStyle.background, /\/ 0\.85\)$/);
  assert.match(headerStyle.blur, /blur\(/);
  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.getByRole("navigation", { name: "Filter by category" }).getByRole("link", { name: "Plumbing" }).click();
  await page.waitForURL((url) => url.searchParams.get("categoryId") === plumbingId);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.setViewportSize({ width: 768, height: 1024 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.setViewportSize({ width: 1280, height: 800 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.goto(`${base}/services`);
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), "Skip to content");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "main-content");
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await page.waitForURL(base + "/");
  await page.goto(`${base}/services`);
  await page.getByRole("navigation", { name: "breadcrumb" }).getByRole("link", { name: "Home" }).click();
  await page.waitForURL(base + "/");
  await page.goto(`${base}/services`);
  const signInLink = page.locator("header").getByRole("link", { name: "Sign in" });
  await signInLink.waitFor();
  assert.equal(await signInLink.getAttribute("href"), "/auth/login");
  await signInLink.click();
  await page.waitForURL("**/auth/login");
  assert.equal(await page.getByRole("button", { name: "Log in" }).count(), 1);
  const loginBreadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
  assert.equal(await loginBreadcrumb.getByRole("link", { name: "Home" }).getAttribute("href"), "/");
  assert.equal(await loginBreadcrumb.getByText("Log in").count(), 1);
  const loginCard = page.getByRole("heading", { name: "Log in" }).locator('xpath=ancestor::*[@data-slot="card"][1]');
  assert.equal(await loginCard.locator("form").count(), 1);
  assert.equal(await loginCard.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  const loginPassword = loginCard.getByLabel("Password", { exact: true });
  await loginPassword.fill("sample-password");
  await loginCard.getByRole("button", { name: "Show password" }).click();
  assert.equal(await loginPassword.getAttribute("type"), "text");
  assert.equal(await loginPassword.inputValue(), "sample-password");
  await loginCard.getByRole("button", { name: "Hide password" }).click();
  assert.equal(await loginPassword.getAttribute("type"), "password");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.equal(await loginCard.getByRole("heading", { name: "Log in" }).isVisible(), true);
  await page.setViewportSize({ width: 1280, height: 800 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.equal(await loginPassword.isVisible(), true);
  await page.setViewportSize({ width: 375, height: 812 });
  assert.match(await page.evaluate(() => getComputedStyle(document.body).backgroundImage), /register-bg\.png/);
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundSize), "cover");
  await page.screenshot({ path: resolve(tmpdir(), "fixitnow-auth-login-current.png"), fullPage: true });
  await page.goto(`${base}/auth/register`);
  const registerBreadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
  assert.equal(await registerBreadcrumb.getByRole("link", { name: "Home" }).getAttribute("href"), "/");
  assert.equal(await registerBreadcrumb.getByText("Create account").count(), 1);
  const registerCard = page.getByRole("heading", { name: "Create an account" }).locator('xpath=ancestor::*[@data-slot="card"][1]');
  assert.equal(await registerCard.locator("form").count(), 1);
  assert.equal(await registerCard.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  const registerPassword = registerCard.getByLabel("Password", { exact: true });
  await registerPassword.fill("sample-password");
  await registerCard.getByRole("button", { name: "Show password" }).click();
  assert.equal(await registerPassword.getAttribute("type"), "text");
  assert.equal(await registerPassword.inputValue(), "sample-password");
  await registerCard.getByRole("button", { name: "Hide password" }).click();
  assert.equal(await registerPassword.getAttribute("type"), "password");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.equal(await registerCard.getByRole("heading", { name: "Create an account" }).isVisible(), true);
  await page.screenshot({ path: resolve(tmpdir(), "fixitnow-auth-register-current.png"), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.equal(await registerPassword.isVisible(), true);
  await page.screenshot({ path: resolve(tmpdir(), "fixitnow-auth-register-desktop-current.png"), fullPage: true });
  assert.match(await page.evaluate(() => getComputedStyle(document.body).backgroundImage), /register-bg\.png/);
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundSize), "cover");
  assert.equal((await page.request.get(`${base}/register-bg.png`)).status(), 200);
  console.log("PASS services filters, pagination, and mobile width");
} finally {
  await browser?.close();
  if (frontend.exitCode === null) {
    frontend.kill();
    await new Promise((resolveExit) => frontend.once("exit", resolveExit));
  }
  await new Promise((resolveClose) => backend.close(resolveClose));
}
