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
const adminBookings = [{
  id: "booking-active",
  status: "PAID",
  priceAtBooking: "100.00",
  createdAt: "2026-01-01T00:00:00.000Z",
  customer: { name: "Customer One" },
  service: { title: "Fan Repair", technicianProfile: { user: { name: "Technician One" } } },
}];
const acceptedBookingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const completedPaymentId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const send = (response, status, data) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(data));
};

const assertSelectedTabStyle = async (tab) => {
  const style = await tab.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      borderColor: computed.borderColor,
      fontWeight: computed.fontWeight,
    };
  });
  assert.deepEqual(style, {
    backgroundColor: "rgb(154, 230, 0)",
    color: "rgb(0, 0, 0)",
    borderColor: "rgba(0, 0, 0, 0)",
    fontWeight: "600",
  });
};

const assertDashboardMainCardContainsHeading = async (page, path) => {
  const mainCard = page.locator(path.startsWith("/dashboard/admin") ? "main" : "main > div[data-slot='card']");
  const pageHeading = mainCard.getByRole("heading", { level: 1 }).first();
  await pageHeading.waitFor();
  assert.ok(await pageHeading.isVisible(), `${path}: page heading must render inside the main card`);
};

const assertDashboardBreadcrumbOrder = async (page, path) => {
  if (path.startsWith("/dashboard/admin")) {
    await page.getByRole("navigation", { name: "Admin navigation" }).waitFor();
    const breadcrumbs = page.getByRole("navigation", { name: "breadcrumb" });
    const card = page.locator("main h1:visible").first();
    await Promise.all([breadcrumbs.waitFor(), card.waitFor()]);
    assert.ok(await breadcrumbs.evaluate((element) => element.getBoundingClientRect().bottom) <= await card.evaluate((element) => element.getBoundingClientRect().top));
    return;
  }
  const tabs = page.getByRole("tablist");
  const breadcrumbs = page.getByRole("navigation", { name: "breadcrumb" });
  const mainCard = page.locator("main > div[data-slot='card']");
  await Promise.all([tabs.waitFor(), breadcrumbs.waitFor(), mainCard.waitFor()]);
  await assertDashboardMainCardContainsHeading(page, path);

  const [tabsTop, breadcrumbsTop, cardTop] = await Promise.all([
    tabs.evaluate((element) => element.getBoundingClientRect().top + window.scrollY),
    breadcrumbs.evaluate((element) => element.getBoundingClientRect().top + window.scrollY),
    mainCard.evaluate((element) => element.getBoundingClientRect().top + window.scrollY),
  ]);
  assert.ok(tabsTop < breadcrumbsTop, `${path}: tabs must appear above breadcrumbs`);
  assert.ok(breadcrumbsTop < cardTop, `${path}: breadcrumbs must appear above the main card`);
};

const assertDashboardContentContained = async (page, path, { requireTable = false } = {}) => {
  if (path.startsWith("/dashboard/admin")) {
    assert.equal(await page.locator("main [data-slot='card']:visible").count(), path === "/dashboard/admin" ? 5 : 0);
    if (requireTable) await page.locator("main table:visible").first().waitFor();
    return;
  }
  const mainCard = page.locator("main > div[data-slot='card']");
  await mainCard.waitFor();
  if (requireTable) await mainCard.locator("table").first().waitFor();

  for (const [kind, selector] of [
    ["table", "table"],
    ["card", "[data-slot='card']"],
    ["section", "section"],
    ["form", "form"],
  ]) {
    const elements = await page.locator(`main ${selector}`).all();
    for (const element of elements) {
      const contained = await element.evaluate(
        (node) => node.closest("main > div[data-slot='card']") !== null
      );
      assert.ok(contained, `${path}: ${kind} content must stay inside the main card`);
    }
  }

  if (requireTable) assert.ok(await mainCard.locator("table").count() > 0, `${path}: expected a table`);
};

const assertDashboardShell = async (page, path) => {
  if (path === "/dashboard/admin") await page.getByRole("heading", { name: "Platform Earnings", exact: true }).waitFor();
  const mainCard = page.locator(path.startsWith("/dashboard/admin") ? "[data-slot='sidebar-inset']" : "main > div[data-slot='card']");
  if (path.startsWith("/dashboard/admin")) {
    assert.equal(await page.locator("main [data-slot='card']:visible").count(), path === "/dashboard/admin" ? 5 : 0);
    assert.equal(await page.locator("header").count(), 0);
  }
  assert.ok(
    ["rgb(255, 255, 255)", "lab(100 0 0)"].includes(await mainCard.evaluate((element) => getComputedStyle(element).backgroundColor)),
    `${path}: content background must be white`
  );
  const footer = page.locator("footer");
  assert.equal(await footer.count(), 1, `${path}: shared footer must appear once`);
  assert.equal(
    await footer.evaluate((element) => getComputedStyle(element).backgroundColor),
    "rgb(239, 239, 239)",
    `${path}: footer must use #EFEFEF`
  );

  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    `${path}: dashboard must not overflow at mobile width`
  );
  await page.setViewportSize({ width: 1280, height: 800 });
};

let healthRequests = 0;
let healthy = true;
const backend = createHttpServer((request, response) => {
  if (request.url === "/health") {
    healthRequests++;
    return send(response, healthy ? 200 : 503, { success: healthy, message: healthy ? "Backend is running and database is connected." : "Backend is running but database is unavailable.", data: { server: "running", database: healthy ? "connected" : "disconnected" } });
  }
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
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      if (JSON.parse(body).refreshToken === "invalid-refresh") return send(response, 401, { message: "Invalid refresh token" });
      send(response, 200, { data: { accessToken: "valid-admin" } });
    });
  } else if (request.url === "/api/auth/me" && role) {
    if (role === "BLOCKED") return send(response, 403, { message: "Your account has been blocked" });
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
  } else if (request.url === "/api/admin/feedbacks" && role === "ADMIN") {
    send(response, 200, { data: [{ id: "review-1", rating: 5, comment: "Excellent repair", createdAt: "2026-01-01T00:00:00.000Z", customer: { name: "Customer One" }, technicianProfile: { user: { name: "Technician One" } }, booking: { service: { title: "Fan Repair" }, items: [] } }] });
  } else if (request.url === "/api/admin/feedbacks" && role) {
    send(response, 403, { message: "Forbidden" });
  } else if (request.url === "/api/admin/bookings" && role === "ADMIN") {
    send(response, 200, { data: adminBookings });
  } else if (request.url === "/api/admin/categories" && role === "ADMIN") {
    send(response, 200, { data: [{ id: "11111111-1111-4111-8111-111111111111", name: "Electrical", slug: "electrical", description: "Electrical work", isActive: true }] });
  } else if (request.url === `/api/bookings/${acceptedBookingId}` && role === "CUSTOMER") {
    send(response, 200, { data: { id: acceptedBookingId, status: "ACCEPTED", priceAtBooking: "100.00", service: { title: "Fan Repair" } } });
  } else if (request.url === `/api/payments/${completedPaymentId}` && role === "CUSTOMER") {
    send(response, 200, { data: { id: completedPaymentId, bookingId: acceptedBookingId, amount: "100.00", status: "COMPLETED", booking: { status: "PAID", items: [{ title: "Fan Repair" }, { title: "Socket Repair" }], service: { title: "Fan Repair" } } } });
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

  const protectedDashboardPaths = {
    customer: ["/dashboard/customer", "/dashboard/customer/payments"],
    technician: ["/dashboard/technician", "/dashboard/technician/bookings"],
    admin: ["/dashboard/admin", "/dashboard/admin/technicians", "/dashboard/admin/payments"],
  };
  for (const authenticatedRole of Object.keys(protectedDashboardPaths)) {
    for (const [requestedRole, paths] of Object.entries(protectedDashboardPaths)) {
      for (const path of paths) {
        const response = await dashboard(path, `accessToken=valid-${authenticatedRole}`);
        if (authenticatedRole === requestedRole) {
          assert.equal(response.status, 200, `${authenticatedRole} should access ${path}`);
        } else {
          assert.equal(response.status, 307, `${authenticatedRole} should not access ${path}`);
          assert.equal(
            new URL(response.headers.get("location"), base).pathname,
            `/dashboard/${authenticatedRole}`,
            `${authenticatedRole} should return to its own dashboard`
          );
        }
      }
    }
  }

  const unknownRole = await dashboard("/dashboard/customer", "accessToken=valid-unknown");
  assert.equal(unknownRole.status, 307);
  assert.equal(new URL(unknownRole.headers.get("location"), base).pathname, "/auth/login");

  const staleRefresh = await dashboard("/dashboard/customer", "refreshToken=invalid-refresh");
  assert.equal(staleRefresh.status, 307);
  const staleCookies = staleRefresh.headers.getSetCookie();
  assert.ok(staleCookies.some((cookie) => /refreshToken=;.*Path=\/;/.test(cookie)));
  assert.ok(staleCookies.some((cookie) => /refreshToken=;.*Path=\/api\/session;/.test(cookie)));
  assert.ok(staleCookies.some((cookie) => /accessToken=;/.test(cookie)));

  const blocked = await dashboard("/dashboard/customer", "accessToken=valid-blocked; refreshToken=valid-refresh");
  assert.equal(blocked.status, 307);
  assert.ok(blocked.headers.getSetCookie().some((cookie) => /refreshToken=;.*Path=\/;/.test(cookie)));
  assert.ok(blocked.headers.getSetCookie().some((cookie) => /accessToken=;.*Path=\/;/.test(cookie)));

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
  const loadingContext = await browser.newContext();
  await loadingContext.addCookies([{ name: "accessToken", value: "valid-customer", url: base }]);
  const loadingPage = await loadingContext.newPage();
  let releaseBookingsResponse;
  const bookingsResponseHeld = new Promise((resolve) => { releaseBookingsResponse = resolve; });
  await loadingPage.route("**/api/customer/bookings", async (route) => {
    await bookingsResponseHeld;
    await route.continue();
  });
  await loadingPage.goto(`${base}/dashboard/customer`);
  const dashboardSkeleton = loadingPage.getByRole("status", { name: "Loading content" });
  await dashboardSkeleton.waitFor();
  releaseBookingsResponse();
  await dashboardSkeleton.waitFor({ state: "hidden" });
  await loadingContext.close();

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
      assert.equal((await roleContext.cookies()).some((cookie) => cookie.name === "refreshToken"), false);
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
  await page.getByRole("heading", { name: /^Technicians \(\d+\)$/ }).waitFor();
  const technicianBreadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
  await technicianBreadcrumb.waitFor();
  assert.equal(await technicianBreadcrumb.count(), 1);
  assert.equal(await technicianBreadcrumb.getByRole("link", { name: "Admin workspace" }).getAttribute("href"), "/dashboard/admin");
  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.setViewportSize({ width: 1280, height: 800 });
  const rows = page.locator("tbody tr:visible");
  await rows.first().waitFor();
  assert.equal(await rows.count(), 12);
  await assertDashboardContentContained(page, "/dashboard/admin/technicians", { requireTable: true });
  assert.equal(await page.getByRole("button", { name: "Next", exact: true }).isDisabled(), true);
  await page.getByLabel("Search technicians").fill("Technician 12");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  assert.equal(await rows.count(), 1);
  await page.getByRole("button", { name: "Ban", exact: true }).click();
  await page.getByText("Banned", { exact: true }).waitFor();
  assert.equal(users[11].activeStatus, "BLOCKED");

  await page.goto(`${base}/dashboard/admin/payments`);
  await page.getByRole("heading", { name: /^Platform Payments \(\d+\)$/ }).waitFor();
  await page.getByRole("cell", { name: "৳85.00" }).waitFor();
  await page.getByRole("cell", { name: "৳15.00" }).waitFor();
  await assertDashboardContentContained(page, "/dashboard/admin/payments", { requireTable: true });
  await page.goto(`${base}/dashboard/admin`);
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await assertDashboardMainCardContainsHeading(page, "/dashboard/admin");
  await assertDashboardShell(page, "/dashboard/admin");
  const adminNavigation = page.getByRole("navigation", { name: "Admin navigation" });
  assert.deepEqual(await adminNavigation.getByRole("link").allTextContents(), ["Overview", "Users", "Technicians", "Platform Payments", "Categories", "Bookings", "Feedbacks"]);
  assert.equal(await page.getByRole("navigation", { name: "Main navigation" }).count(), 0);
  assert.equal(await page.getByRole("tablist").count(), 0);
  await page.locator('[data-slot="sidebar-footer"]').getByText("Test user", { exact: true }).waitFor();
  assert.equal(await page.locator('[data-slot="sidebar-footer"]').getByText("Admin", { exact: true }).count(), 1);
  assert.equal(await page.locator('[data-slot="sidebar-header"]').getByRole("link", { name: "FixItNow" }).getAttribute("href"), "/");
  const selectedOverview = adminNavigation.getByRole("link", { name: "Overview", exact: true });
  assert.equal(await selectedOverview.getAttribute("aria-current"), "page");
  assert.equal(await selectedOverview.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(154, 230, 0)");
  for (const link of await adminNavigation.getByRole("link").all()) {
    if (await link.getAttribute("aria-current") !== "page") assert.notEqual(await link.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(154, 230, 0)");
  }
  assert.equal(await page.locator("main [data-slot='card']:visible").count(), 5);
  assert.equal(await page.locator("header").count(), 0);
  assert.equal(await page.getByRole("search").count(), 0);
  const platformOverview = page.getByRole("region", { name: "Platform overview" });
  assert.equal(await platformOverview.locator('[data-slot="chart"]').count(), 4);
  assert.deepEqual(await platformOverview.getByRole("heading", { level: 2 }).allTextContents(), ["Platform Earnings", "Users", "Technicians", "System Health", "Bookings"]);
  await page.getByText("Backend is running and database is connected.", { exact: true }).waitFor();
  const baselineHealthRequests = healthRequests;
  await adminNavigation.getByRole("link", { name: "Users", exact: true }).click();
  await page.waitForURL("**/dashboard/admin/users");
  healthy = false;
  await adminNavigation.getByRole("link", { name: "Overview", exact: true }).click();
  await page.getByText("Backend is running but database is unavailable.", { exact: true }).waitFor();
  assert.ok(healthRequests > baselineHealthRequests, "Revisiting overview must check backend health again");
  healthy = true;
  await page.getByRole("button", { name: "Check again", exact: true }).click();
  await page.getByText("Backend is running and database is connected.", { exact: true }).waitFor();
  await page.getByRole("heading", { name: "Platform Earnings", exact: true }).waitFor();
  assert.equal((await dashboard("/api/admin/health", "accessToken=valid-customer")).status, 403);
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1366, height: 768 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.waitForFunction(() => document.documentElement.scrollHeight <= innerHeight + 1);
    for (const card of await platformOverview.locator('[data-slot="card"]').all()) {
      const box = await card.boundingBox();
      assert.ok(box.y >= 0 && box.y + box.height <= viewport.height, "Overview cards must fit within the desktop viewport");
    }
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForFunction(() => {
    const curves = [...document.querySelectorAll('[data-slot="chart"] .recharts-area-curve')];
    return curves.length === 4 && curves.every((curve) => curve.getTotalLength() > 200);
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: process.env.TEMP + "/fixitnow-admin-sidebar.png", fullPage: true });
  await adminNavigation.getByRole("link", { name: "Users", exact: true }).click();
  await page.waitForURL("**/dashboard/admin/users");
  await page.getByLabel("Search users").waitFor();
  await assertDashboardContentContained(page, "/dashboard/admin/users", { requireTable: true });
  await page.getByLabel("Search users").fill("Technician 12");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  assert.equal(await page.locator("tbody tr:visible").count(), 1);
  await adminNavigation.getByRole("link", { name: "Categories", exact: true }).click();
  await page.waitForURL("**/dashboard/admin/categories");
  const addCategory = page.getByRole("button", { name: "Add Category", exact: true });
  await addCategory.click();
  const categoryDialog = page.getByRole("dialog");
  await categoryDialog.getByRole("heading", { name: "Add Category", exact: true }).waitFor();
  assert.equal(await categoryDialog.getByLabel("Name", { exact: true }).inputValue(), "");
  await categoryDialog.getByLabel("Name", { exact: true }).fill("Unsaved category");
  await page.keyboard.press("Escape");
  await categoryDialog.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await categoryDialog.getByRole("heading", { name: "Edit Category", exact: true }).waitFor();
  assert.equal(await categoryDialog.getByLabel("Name", { exact: true }).inputValue(), "Electrical");
  assert.equal(await categoryDialog.getByLabel("Slug", { exact: true }).inputValue(), "electrical");
  const active = page.getByRole("checkbox", { name: "Active", exact: true });
  await active.waitFor();
  assert.equal(await active.isChecked(), true);
  await active.click();
  assert.equal(await active.isChecked(), false);
  await categoryDialog.getByRole("button", { name: "Close", exact: true }).click();
  await categoryDialog.waitFor({ state: "hidden" });
  await addCategory.click();
  assert.equal(await categoryDialog.getByLabel("Name", { exact: true }).inputValue(), "");
  await categoryDialog.getByRole("button", { name: "Close", exact: true }).click();
  await categoryDialog.waitFor({ state: "hidden" });
  await adminNavigation.getByRole("link", { name: "Bookings", exact: true }).click();
  await page.waitForURL("**/dashboard/admin/bookings");
  await page.getByRole("cell", { name: "Fan Repair", exact: true }).waitFor();
  await adminNavigation.getByRole("link", { name: "Feedbacks", exact: true }).click();
  await page.waitForURL("**/dashboard/admin/feedbacks");
  await page.getByRole("cell", { name: "Excellent repair", exact: true }).waitFor();
  await page.getByRole("cell", { name: "5 / 5", exact: true }).waitFor();
  assert.equal(await adminNavigation.getByRole("link", { name: "Feedbacks", exact: true }).getAttribute("aria-current"), "page");
  const forbiddenFeedback = await dashboard("/api/admin/feedbacks", "accessToken=valid-customer");
  assert.equal(forbiddenFeedback.status, 403);
  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  const mobileNavigation = page.getByRole("navigation", { name: "Admin navigation" });
  await mobileNavigation.getByRole("link", { name: "Overview", exact: true }).click();
  await page.waitForURL("**/dashboard/admin");
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.screenshot({ path: process.env.TEMP + "/fixitnow-admin-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await page.waitForFunction(() => {
    const sidebar = document.querySelector('[data-slot="sidebar-container"]');
    return sidebar && sidebar.getBoundingClientRect().right <= 1;
  });
  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await adminNavigation.waitFor();

  // Every admin data page caps tables at 30 rows and resets pagination on search.
  for (const [section, title] of [["users", "Users"], ["technicians", "Technicians"], ["payments", "Platform Payments"], ["categories", "Categories"], ["bookings", "Bookings"], ["feedbacks", "Feedbacks"]]) {
    const endpoint = section === "technicians" ? "users" : section;
    const fixtureResponse = await page.request.get(`${base}/api/admin/${endpoint}`);
    const fixture = (await fixtureResponse.json())[0];
    const fixtures = Array.from({ length: 65 }, (_, index) => {
      const record = structuredClone(fixture);
      record.id = `pagination-${index + 1}`;
      const text = `Pagination record ${index + 1}`;
      if (section === "users" || section === "technicians" || section === "categories") record.name = text;
      if (section === "payments" || section === "bookings") record[section === "payments" ? "booking" : "customer" ] = section === "payments" ? { ...record.booking, customer: { name: text } } : { name: text };
      if (section === "feedbacks") record.comment = text;
      return record;
    });
    await page.route(`**/api/admin/${endpoint}`, (route) => route.fulfill({ json: fixtures }));
    await page.goto(`${base}/dashboard/admin/${section}`);
    await page.getByRole("heading", { level: 1, name: `${title} (65)`, exact: true }).waitFor();
    const search = page.getByPlaceholder(`Search ${title.toLowerCase()}`, { exact: true });
    await search.waitFor();
    assert.equal(await page.locator("main h1:visible").count(), 1);
    assert.equal(await page.locator('label').filter({ hasText: `Search ${title.toLowerCase()}` }).count(), 0);
    assert.equal(await page.locator("tbody tr:visible").count(), 30);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    assert.equal(await page.locator("tbody tr:visible").count(), 30);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    assert.equal(await page.locator("tbody tr:visible").count(), 5);
    await search.fill("Pagination record 65");
    await search.press("Enter");
    assert.equal(await page.locator("tbody tr:visible").count(), 1);
    await page.getByText("Page 1 of 1", { exact: true }).waitFor();
    assert.equal(await page.getByRole("heading", { level: 1 }).innerText(), `${title} (65)`);
    await search.fill("");
    assert.equal(await page.locator("tbody tr:visible").count(), 30);
    await page.getByText("Page 1 of 3", { exact: true }).waitFor();
    if (section === "users") await page.screenshot({ path: process.env.TEMP + "/fixitnow-admin-users-pagination.png", fullPage: true });
    await page.unroute(`**/api/admin/${endpoint}`);
  }

  // Verify consistent page structure on Customer dashboard
  const custContext = await browser.newContext();
  await custContext.addCookies([{ name: "accessToken", value: "valid-customer", url: base }]);
  const custPage = await custContext.newPage();
  await custPage.goto(`${base}/dashboard/customer`);
  await assertDashboardMainCardContainsHeading(custPage, "/dashboard/customer");
  await assertDashboardShell(custPage, "/dashboard/customer");
  await assertDashboardContentContained(custPage, "/dashboard/customer");
  const custTabs = custPage.getByRole("tablist");
  await custTabs.waitFor();
  assert.deepEqual(await custTabs.getByRole("tab").allTextContents(), ["Bookings", "Payments"]);
  const activeCustTab = custTabs.getByRole("tab", { name: "Bookings" });
  await assertSelectedTabStyle(activeCustTab);
  const custBreadcrumbs = custPage.getByRole("navigation", { name: "breadcrumb" });
  const custMainCard = custPage.locator("main div[data-slot='card']");
  const custTabsTop = await custTabs.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const custBreadcrumbsTop = await custBreadcrumbs.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const custCardTop = await custMainCard.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  assert.ok(custTabsTop < custBreadcrumbsTop, "Customer tabs must appear above breadcrumbs");
  assert.ok(custBreadcrumbsTop < custCardTop, "Customer breadcrumbs must appear above main card");
  assert.equal(await custMainCard.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(255, 255, 255)");
  await custTabs.getByRole("tab", { name: "Payments" }).click();
  await custPage.waitForURL("**/dashboard/customer/payments");
  await custPage.getByRole("heading", { name: "Payment history" }).waitFor();
  await custContext.close();

  // Verify consistent page structure on Technician dashboard
  const techCtx = await browser.newContext();
  await techCtx.addCookies([{ name: "accessToken", value: "valid-technician", url: base }]);
  const tPage = await techCtx.newPage();
  await tPage.goto(`${base}/dashboard/technician`);
  await assertDashboardMainCardContainsHeading(tPage, "/dashboard/technician");
  await tPage.getByRole("heading", { name: "Your profile" }).waitFor();
  await assertDashboardShell(tPage, "/dashboard/technician");
  await assertDashboardContentContained(tPage, "/dashboard/technician");
  const techTabs = tPage.getByRole("tablist");
  await techTabs.waitFor();
  assert.deepEqual(await techTabs.getByRole("tab").allTextContents(), ["Overview & Services", "Booking requests"]);
  const activeTechTab = techTabs.getByRole("tab", { name: "Overview & Services" });
  await assertSelectedTabStyle(activeTechTab);
  const techBreadcrumbs = tPage.getByRole("navigation", { name: "breadcrumb" });
  const techMainCard = tPage.locator("main div[data-slot='card']");
  const tTabsTop = await techTabs.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const tBreadcrumbsTop = await techBreadcrumbs.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const tCardTop = await techMainCard.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  assert.ok(tTabsTop < tBreadcrumbsTop, "Technician tabs must appear above breadcrumbs");
  assert.ok(tBreadcrumbsTop < tCardTop, "Technician breadcrumbs must appear above main card");
  assert.equal(await techMainCard.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(255, 255, 255)");
  await techTabs.getByRole("tab", { name: "Booking requests" }).click();
  await tPage.waitForURL("**/dashboard/technician/bookings");
  await tPage.getByRole("heading", { name: "Booking requests" }).waitFor();
  await techCtx.close();

  const nestedDashboardRoutes = [
    { path: "/dashboard/customer/payments", role: "customer" },
    { path: "/dashboard/technician/bookings", role: "technician" },
    { path: "/dashboard/admin/technicians", role: "admin" },
    { path: "/dashboard/admin/payments", role: "admin" },
  ];
  for (const route of nestedDashboardRoutes) {
    const nestedContext = await browser.newContext();
    await nestedContext.addCookies([{ name: "accessToken", value: `valid-${route.role}`, url: base }]);
    const nestedPage = await nestedContext.newPage();
    await nestedPage.goto(`${base}${route.path}`);
    await assertDashboardBreadcrumbOrder(nestedPage, route.path);
    await assertDashboardShell(nestedPage, route.path);
    await assertDashboardContentContained(nestedPage, route.path, {
      requireTable: route.path.startsWith("/dashboard/admin/"),
    });
    await nestedContext.close();
  }

  const paymentContext = await browser.newContext();
  await paymentContext.addCookies([{ name: "accessToken", value: "valid-customer", url: base }]);
  const paymentPage = await paymentContext.newPage();
  await paymentPage.goto(`${base}/dashboard/customer/bookings/${acceptedBookingId}/pay`);
  await paymentPage.getByRole("heading", { name: "Pay for booking" }).waitFor();
  await paymentPage.getByRole("button", { name: "Continue to Stripe" }).waitFor();
  assert.equal(await paymentPage.getByText("Fan Repair").count(), 1);
  assert.equal(await paymentPage.getByRole("link", { name: "Back to bookings" }).evaluate((element) => getComputedStyle(element).color), "rgb(154, 230, 0)");
  assert.equal(await paymentPage.locator("footer").evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  assert.equal(await paymentPage.locator("main div.bg-card").last().evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(255, 255, 255)");
  await paymentPage.setViewportSize({ width: 375, height: 812 });
  assert.equal(await paymentPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

  await paymentPage.goto(`${base}/payment/success?paymentId=${completedPaymentId}`);
  await paymentPage.getByText("Stripe payment confirmed by the server.").waitFor();
  await paymentPage.getByText("Fan Repair, Socket Repair", { exact: true }).waitFor();
  assert.equal(await paymentPage.locator("footer").evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  assert.equal(await paymentPage.locator("main div.bg-card").last().evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  assert.equal(await paymentPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

  await paymentPage.goto(`${base}/payment/cancel`);
  await paymentPage.getByRole("heading", { name: "Checkout cancelled" }).waitFor();
  assert.equal(await paymentPage.locator("footer").evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(239, 239, 239)");
  assert.equal(await paymentPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await paymentContext.close();

  console.log("PASS dashboard roles, admin views, and consistent page structure");
} finally {
  await browser?.close();
  if (frontend.exitCode === null) {
    frontend.kill();
    await new Promise((resolve) => frontend.once("exit", resolve));
  }
  await new Promise((resolve) => backend.close(resolve));
}
