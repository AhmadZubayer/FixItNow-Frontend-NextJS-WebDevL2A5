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

  if (request.url === "/api/auth/login" && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      if (JSON.parse(body).email === "bad@example.test") return send(response, 401, { message: "Invalid credentials" });
      send(response, 200, { data: { accessToken: "valid-customer", refreshToken: "valid-refresh" } });
    });
  } else if (request.url === "/api/auth/register" && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      if (JSON.parse(body).email === "taken@example.test") return send(response, 409, { message: "Email already registered" });
      send(response, 201, { data: { id: "registered-customer" } });
    });
  } else if (request.url === "/api/auth/refresh-token" && request.method === "POST") {
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
  } else if ((request.url === "/api/customer/bookings" || request.url === "/api/bookings") && role === "CUSTOMER") {
    send(response, 200, { data: [] });
  } else if ((request.url === "/api/customer/payments" || request.url === "/api/payments") && role === "CUSTOMER") {
    send(response, 200, { data: [] });
  } else if (request.url === "/api/technician/profile" && role === "TECHNICIAN") {
    send(response, 200, { data: { id: "tech-1", bio: "Bio", skills: [], experienceYears: 3, location: "Dhaka", profilePhoto: null, services: [], availabilitySlots: [] } });
  } else if (request.url === "/api/technician/bookings" && role === "TECHNICIAN") {
    send(response, 200, { data: [] });
  } else if (request.url === "/api/categories") {
    send(response, 200, { data: [] });
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
  for (const role of ["customer", "technician", "admin"]) {
    const roleContext = await browser.newContext();
    await roleContext.addCookies([{ name: "accessToken", value: `valid-${role}`, url: base }]);
    const rolePage = await roleContext.newPage();
    await rolePage.goto(`${base}/auth/login`);
    const mainNavigation = rolePage.getByRole("navigation", { name: "Main navigation" });
    const dashboardLink = mainNavigation.getByRole("link", { name: "Dashboard" });
    await dashboardLink.waitFor();
    assert.equal(await dashboardLink.getAttribute("href"), `/dashboard/${role}`);
    assert.equal(await dashboardLink.count(), 1);
    await rolePage.setViewportSize({ width: 375, height: 812 });
    assert.equal(await rolePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await mainNavigation.getByRole("link", { name: "Services & Technicians" }).isVisible(), true);
    assert.equal(await dashboardLink.isVisible(), true);
    const accountTrigger = rolePage.locator("header").getByRole("button", { name: "Test user" });
    await accountTrigger.click();
    const logoutItem = rolePage.getByRole("menuitem", { name: "Log out" });
    await logoutItem.waitFor();
    if (role === "customer") {
      await logoutItem.click();
      await dashboardLink.waitFor({ state: "detached" });
      await rolePage.locator("header").getByRole("link", { name: "Sign in" }).waitFor();
      assert.equal((await roleContext.cookies()).some((cookie) => cookie.name === "accessToken"), false);
    }
    await roleContext.close();
  }
  const loginContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const loginPage = await loginContext.newPage();
  await loginPage.goto(`${base}/auth/login`);
  await loginPage.getByRole("link", { name: "Sign in" }).waitFor();
  await loginPage.getByRole("button", { name: "Log in" }).click();
  await loginPage.getByText("Enter a valid email address").waitFor();
  await loginPage.getByText("Password is required").waitFor();
  await loginPage.getByLabel("Email").fill("bad@example.test");
  await loginPage.getByLabel("Password", { exact: true }).fill("wrong-password");
  await loginPage.getByRole("button", { name: "Log in" }).click();
  await loginPage.getByText("Invalid credentials").waitFor();
  assert.match(loginPage.url(), /\/auth\/login$/);
  await loginPage.getByLabel("Email").fill("customer@example.test");
  await loginPage.getByLabel("Password", { exact: true }).fill("password123");
  await loginPage.getByRole("button", { name: "Log in" }).click();
  await loginPage.waitForURL("**/dashboard/customer");
  await loginPage.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Dashboard" }).waitFor();
  assert.equal(await loginPage.locator("header").getByRole("button", { name: "Test user" }).isVisible(), true);
  assert.equal(await loginPage.locator("header").getByRole("link", { name: "Sign in" }).count(), 0);
  assert.equal(await loginPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await loginContext.close();
  const registerContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const registerPage = await registerContext.newPage();
  await registerPage.goto(`${base}/auth/register`);
  await registerPage.getByRole("button", { name: "Create account" }).click();
  await registerPage.getByText("Name must contain at least 2 characters").waitFor();
  await registerPage.getByText("Password must contain at least 8 characters").waitFor();
  await registerPage.getByLabel("Name").fill("New Customer");
  await registerPage.getByLabel("Email").fill("taken@example.test");
  await registerPage.getByLabel("Password", { exact: true }).fill("password123");
  await registerPage.getByRole("button", { name: "Create account" }).click();
  await registerPage.getByText("Email already registered").waitFor();
  assert.match(registerPage.url(), /\/auth\/register$/);
  await registerPage.getByLabel("Email").fill("new@example.test");
  await registerPage.getByRole("button", { name: "Create account" }).click();
  await registerPage.waitForURL("**/auth/login");
  assert.equal(await registerPage.getByRole("button", { name: "Log in" }).count(), 1);
  await registerContext.close();
  const context = await browser.newContext();
  await context.addCookies([{ name: "accessToken", value: "valid-admin", url: base }]);
  const page = await context.newPage();
  await page.goto(`${base}/dashboard/admin/technicians`);
  await page.getByRole("heading", { name: "Technician management" }).waitFor();
  const technicianBreadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
  await technicianBreadcrumb.waitFor();
  assert.equal(await technicianBreadcrumb.count(), 1);
  assert.equal(await technicianBreadcrumb.getByRole("link", { name: "Admin workspace" }).getAttribute("href"), "/dashboard/admin");
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
  assert.equal(await page.locator("footer").count(), 1);
  await page.getByRole("heading", { name: "Categories" }).waitFor();
  const overviewCard = page.locator('section[aria-label="Platform overview"] > div').first();
  assert.equal(await overviewCard.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  await page.getByRole("button", { name: "Edit" }).click();
  const active = page.getByRole("checkbox", { name: "Active" });
  await active.waitFor();
  assert.equal(await active.isChecked(), true);
  await active.click();
  assert.equal(await active.isChecked(), false);

  // Verify consistent page structure on Admin dashboard
  const adminTabs = page.getByRole("tablist");
  await adminTabs.waitFor();
  const activeAdminTab = adminTabs.getByRole("tab", { name: "Overview & Users" });
  assert.ok(await activeAdminTab.evaluate((element) => getComputedStyle(element).backgroundColor === "rgb(154, 230, 0)" || getComputedStyle(element).backgroundColor.includes("oklab") || getComputedStyle(element).backgroundColor.includes("154")));
  const adminBreadcrumbs = page.getByRole("navigation", { name: "breadcrumb" });
  const adminMainCard = page.locator("main div[data-slot='card']");
  const adminTabsTop = await adminTabs.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const adminBreadcrumbsTop = await adminBreadcrumbs.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const adminCardTop = await adminMainCard.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  assert.ok(adminTabsTop < adminBreadcrumbsTop, "Admin tabs must appear above breadcrumbs");
  assert.ok(adminBreadcrumbsTop < adminCardTop, "Admin breadcrumbs must appear above main card");
  assert.equal(await adminMainCard.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");

  // Verify consistent page structure on Customer dashboard
  const custContext = await browser.newContext();
  await custContext.addCookies([{ name: "accessToken", value: "valid-customer", url: base }]);
  const custPage = await custContext.newPage();
  await custPage.goto(`${base}/dashboard/customer`);
  const custTabs = custPage.getByRole("tablist");
  await custTabs.waitFor();
  const activeCustTab = custTabs.getByRole("tab", { name: "Bookings" });
  assert.ok(await activeCustTab.evaluate((element) => getComputedStyle(element).backgroundColor === "rgb(154, 230, 0)" || getComputedStyle(element).backgroundColor.includes("oklab") || getComputedStyle(element).backgroundColor.includes("154")));
  const custBreadcrumbs = custPage.getByRole("navigation", { name: "breadcrumb" });
  const custMainCard = custPage.locator("main div[data-slot='card']");
  const custTabsTop = await custTabs.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const custBreadcrumbsTop = await custBreadcrumbs.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const custCardTop = await custMainCard.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  assert.ok(custTabsTop < custBreadcrumbsTop, "Customer tabs must appear above breadcrumbs");
  assert.ok(custBreadcrumbsTop < custCardTop, "Customer breadcrumbs must appear above main card");
  assert.equal(await custMainCard.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  await custContext.close();

  // Verify consistent page structure on Technician dashboard
  const techCtx = await browser.newContext();
  await techCtx.addCookies([{ name: "accessToken", value: "valid-technician", url: base }]);
  const tPage = await techCtx.newPage();
  await tPage.goto(`${base}/dashboard/technician`);
  const techTabs = tPage.getByRole("tablist");
  await techTabs.waitFor();
  const activeTechTab = techTabs.getByRole("tab", { name: "Overview & Services" });
  assert.ok(await activeTechTab.evaluate((element) => getComputedStyle(element).backgroundColor === "rgb(154, 230, 0)" || getComputedStyle(element).backgroundColor.includes("oklab") || getComputedStyle(element).backgroundColor.includes("154")));
  const techBreadcrumbs = tPage.getByRole("navigation", { name: "breadcrumb" });
  const techMainCard = tPage.locator("main div[data-slot='card']");
  const tTabsTop = await techTabs.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const tBreadcrumbsTop = await techBreadcrumbs.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const tCardTop = await techMainCard.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  assert.ok(tTabsTop < tBreadcrumbsTop, "Technician tabs must appear above breadcrumbs");
  assert.ok(tBreadcrumbsTop < tCardTop, "Technician breadcrumbs must appear above main card");
  assert.equal(await techMainCard.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  await techCtx.close();

  console.log("PASS dashboard roles, admin views, and consistent page structure");
} finally {
  await browser?.close();
  if (frontend.exitCode === null) {
    frontend.kill();
    await new Promise((resolve) => frontend.once("exit", resolve));
  }
  await new Promise((resolve) => backend.close(resolve));
}
