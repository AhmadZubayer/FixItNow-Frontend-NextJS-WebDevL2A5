import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright-core";

const frontendDirectory = process.cwd();
const backendDirectory = resolve(frontendDirectory, "../FixItNow-backend-server");
const backendEnv = Object.fromEntries(readFileSync(resolve(backendDirectory, ".env"), "utf8").split(/\r?\n/).filter((line) => line.includes("=") && !line.startsWith("#")).map((line) => {
  const divider = line.indexOf("=");
  return [line.slice(0, divider), line.slice(divider + 1).replace(/^['"]|['"]$/g, "")];
}));
const testCredentials = process.env.FIXITNOW_TEST_TECH_FILE ? JSON.parse(readFileSync(process.env.FIXITNOW_TEST_TECH_FILE, "utf8")) : null;
const node = process.execPath;

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
  throw new Error(`Local server did not become ready: ${new URL(url).pathname}`);
}

const backendPort = await availablePort();
let frontendPort = await availablePort();
while (frontendPort === backendPort) frontendPort = await availablePort();
const base = `http://127.0.0.1:${frontendPort}`;
const backendEnvironment = { ...process.env, ...backendEnv, NODE_ENV: "production", PORT: String(backendPort), APP_URL: base, SERVER_URL: `http://127.0.0.1:${backendPort}` };
const frontendEnvironment = { ...process.env, NODE_ENV: "production", API_BASE_URL: `http://127.0.0.1:${backendPort}` };
for (const key of ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "ADMIN_PASSWORD", "DATABASE_URL"]) delete frontendEnvironment[key];
const backendProcess = spawn(node, ["dist/server.js"], { cwd: backendDirectory, env: backendEnvironment, stdio: "ignore" });
const frontendProcess = spawn(node, ["node_modules/next/dist/bin/next", "start", "-p", String(frontendPort)], { cwd: frontendDirectory, env: frontendEnvironment, stdio: "ignore" });
let browser;
let failures = 0;

async function check(name, action) {
  try { await action(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}: ${error.message}`); }
}

async function login(page, email, password, destination) {
  await page.goto(`${base}/auth/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(`**${destination}`, { timeout: 15000 });
  await page.getByRole("heading", { level: 1 }).waitFor();
}

try {
  await Promise.all([waitFor(`http://127.0.0.1:${backendPort}/api/categories`), waitFor(`${base}/auth/login`)]);
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await check("public home and mobile width", async () => {
    await page.goto(base);
    await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 15000 });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: resolve(tmpdir(), "fixitnow-mobile-home.png"), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  await check("keyboard focus, reduced motion, and narrow service layout", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${base}/services`);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole("heading", { name: "Browse services" }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement !== document.body), true);
    assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  await check("public route loading skeleton", async () => {
    await page.route("**/services?*", async (route) => {
      if (route.request().headers().rsc === "1") await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500));
      await route.continue().catch((error) => {
        if (!error.message.includes("already handled")) throw error;
      });
    });
    await page.goto(base);
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Services & Technicians" }).click();
    await page.getByRole("status", { name: "Loading content" }).waitFor({ timeout: 5000 });
    await page.getByRole("heading", { name: "Browse services" }).waitFor();
    await page.unroute("**/services?*");
  });

  await check("public filter validation", async () => {
    await page.goto(`${base}/services?minPrice=100&maxPrice=10`);
    await page.getByText("Check the highlighted filters and try again.").waitFor();
    assert.equal(await page.locator("#maxPrice").getAttribute("aria-invalid"), "true");
  });

  await check("public search, empty results, and technician detail", async () => {
    await page.goto(`${base}/services`);
    await page.getByRole("heading", { name: "Browse services" }).waitFor();
    const firstService = await page.locator('section[aria-labelledby="service-results"] [data-slot="card-title"]').first().innerText();
    await page.locator("#q").fill(firstService);
    await page.getByRole("button", { name: "Apply filters" }).click();
    await page.locator('section[aria-labelledby="service-results"] [data-slot="card-title"]').first().waitFor();
    assert.ok((await page.locator('section[aria-labelledby="service-results"] [data-slot="card-title"]').count()) > 0);
    await page.locator("#q").fill("zzzz-no-service-match");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await page.getByText("No services found").waitFor();
    await page.getByText("No technicians found").waitFor();
    await page.getByRole("link", { name: "Clear" }).click();
    await page.locator('a[href^="/technicians/"]').first().click();
    await page.getByRole("heading", { name: "Services and prices" }).waitFor();
    await page.getByRole("heading", { name: "Customer reviews" }).waitFor();
  });

  await check("anonymous and expired dashboard access", async () => {
    const anonymous = await browser.newPage();
    await anonymous.goto(`${base}/dashboard/admin`);
    await anonymous.waitForURL("**/auth/login");
    await anonymous.close();
    const expiredContext = await browser.newContext();
    await expiredContext.addCookies([{ name: "accessToken", value: "invalid", url: base }]);
    const expired = await expiredContext.newPage();
    await expired.goto(`${base}/dashboard/admin`);
    await expired.waitForURL("**/auth/login", { timeout: 15000 });
    await expiredContext.close();
  });

  await check("registration field errors", async () => {
    await page.goto(`${base}/auth/register`);
    await page.getByRole("button", { name: "Create account" }).click();
    assert.ok((await page.locator('[aria-invalid="true"]').count()) >= 3);
  });

  if (testCredentials) await check("registration duplicate error and pending state", async () => {
    await page.getByLabel("Name").fill("Existing Test Customer");
    await page.getByLabel("Email").fill(testCredentials.customerEmail);
    await page.getByLabel("Password").fill(testCredentials.customerPassword);
    await page.route("**/api/session/register", async (route) => {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 350));
      await route.continue();
    });
    const registrationResponse = page.waitForResponse((response) => response.url().includes("/api/session/register") && response.status() === 409);
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByRole("button", { name: "Creating account" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Creating account" }).isDisabled(), true);
    await registrationResponse;
    await page.unroute("**/api/session/register");
    await page.locator('[data-sonner-toast][data-type="error"]').last().waitFor();
  });

  await check("login validation, failure, and admin navigation", async () => {
    await page.goto(`${base}/auth/login`);
    await page.getByRole("button", { name: "Log in" }).click();
    assert.ok((await page.locator('[aria-invalid="true"]').count()) >= 2);
    await page.getByLabel("Email").fill(backendEnv.ADMIN_EMAIL);
    await page.getByLabel("Password").fill("incorrect-password");
    await page.route("**/api/session/login", async (route) => {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 350));
      await route.continue();
    });
    const loginFailure = page.waitForResponse((response) => response.url().includes("/api/session/login") && response.status() === 401);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("button", { name: "Logging in" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Logging in" }).isDisabled(), true);
    await loginFailure;
    await page.unroute("**/api/session/login");
    await page.locator('[data-sonner-toast][data-type="error"]').last().waitFor();
    await page.getByLabel("Password").fill(backendEnv.ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL("**/dashboard/admin", { timeout: 15000 });
    await page.getByRole("heading", { name: "Admin workspace" }).waitFor();
    await page.getByLabel("Search users").waitFor({ timeout: 15000 });
  });

  await check("admin search and category field validation", async () => {
    await page.getByLabel("Search users").fill("x".repeat(101));
    await page.getByRole("button", { name: "Search" }).click();
    assert.equal(await page.getByLabel("Search users").getAttribute("aria-invalid"), "true");
    await page.getByRole("button", { name: "Add category" }).click();
    assert.equal(await page.locator("#category-name").getAttribute("aria-invalid"), "true");
    assert.equal(await page.locator("#category-slug").getAttribute("aria-invalid"), "true");
  });

  await check("admin user search and pagination", async () => {
    await page.getByLabel("Search users").fill("TECHNICIAN");
    await page.getByRole("button", { name: "Search" }).click();
    assert.equal(await page.getByLabel("Search users").getAttribute("aria-invalid"), "false");
    assert.ok((await page.locator("tbody tr").count()) > 0);
    await page.getByLabel("Search users").fill("");
    await page.getByRole("button", { name: "Search" }).click();
    await page.getByText(/Page 1 of \d+/).waitFor();
    if (await page.getByRole("button", { name: "Next" }).isEnabled()) {
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByText(/Page 2 of \d+/).waitFor();
    }
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: resolve(tmpdir(), "fixitnow-admin-mobile.png"), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  await check("admin category duplicate API feedback", async () => {
    const response = await page.request.get(`${base}/api/admin/categories`);
    assert.equal(response.status(), 200);
    const category = (await response.json())[0];
    await page.locator("#category-name").fill(category.name);
    await page.locator("#category-slug").fill(category.slug);
    await Promise.all([
      page.waitForResponse((result) => result.url().includes("/api/admin/categories") && result.request().method() === "POST" && result.status() === 409),
      page.getByRole("button", { name: "Add category" }).click(),
    ]);
    await page.locator('[data-sonner-toast][data-type="error"]').last().waitFor();
  });

  await check("admin category edit success", async () => {
    await page.getByRole("button", { name: "Edit" }).first().click();
    const update = page.waitForResponse((response) => response.url().includes("/api/admin/categories/") && response.request().method() === "PATCH" && response.status() === 200);
    await page.getByRole("button", { name: "Update category" }).click();
    await update;
    await page.locator('[data-sonner-toast][data-type="success"]').last().waitFor();
  });

  if (testCredentials) {
    await check("technician dashboard and form validation", async () => {
      await login(page, testCredentials.email, testCredentials.password, "/dashboard/technician");
      await page.getByRole("heading", { name: "Your profile" }).waitFor();
      await page.locator("#location").fill("");
      await page.getByRole("button", { name: "Save profile" }).click();
      assert.equal(await page.locator("#location").getAttribute("aria-invalid"), "true");
      await page.getByRole("button", { name: "Add service" }).click();
      assert.equal(await page.locator("#service-title").getAttribute("aria-invalid"), "true");
      await page.getByRole("button", { name: "Add time" }).click();
      assert.equal(await page.locator("#slot-start").getAttribute("aria-invalid"), "true");
      await page.screenshot({ path: resolve(tmpdir(), "fixitnow-technician-desktop.png"), fullPage: true });
    });

    await check("technician form API errors", async () => {
      const fail = async (pattern, method, buttonName, pendingName) => {
        await page.route(pattern, async (route) => {
          if (route.request().method() === method) {
            await new Promise((resolveDelay) => setTimeout(resolveDelay, 350));
            await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Test service outage" }) });
          }
          else await route.continue();
        });
        const response = page.waitForResponse((result) => result.url().includes(pattern.replaceAll("*", "")) && result.request().method() === method && result.status() === 503);
        await page.getByRole("button", { name: buttonName }).click();
        await page.getByRole("button", { name: pendingName }).waitFor();
        assert.equal(await page.getByRole("button", { name: pendingName }).isDisabled(), true);
        await response;
        await page.getByText("Test service outage").last().waitFor();
        await page.unroute(pattern);
      };
      await page.locator("#location").fill("Dhaka");
      await fail("**/api/technician/profile", "PUT", "Save profile", "Saving profile");
      await page.locator("#service-title").fill("Local test service");
      await page.locator("#service-description").fill("A valid test service description");
      await page.locator("#service-price").fill("120");
      await page.locator("#service-category").selectOption({ index: 1 });
      await fail("**/api/technician/services", "POST", "Add service", "Saving service");
      const dateInput = (offset) => new Date(Date.now() + offset).toLocaleString("sv-SE", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).replace(" ", "T");
      await page.locator("#slot-start").fill(dateInput(30 * 86400000));
      await page.locator("#slot-end").fill(dateInput(30 * 86400000 + 3600000));
      await fail("**/api/technician/availability", "PUT", "Add time", "Adding time");
    });

    await check("technician profile and service edit success", async () => {
      const profile = page.waitForResponse((response) => response.url().includes("/api/technician/profile") && response.request().method() === "PUT" && response.status() === 200);
      await page.getByRole("button", { name: "Save profile" }).click();
      await profile;
      await page.getByRole("button", { name: "Edit" }).first().click();
      const service = page.waitForResponse((response) => response.url().includes("/api/technician/services/") && response.request().method() === "PATCH" && response.status() === 200);
      await page.getByRole("button", { name: "Update service" }).click();
      await service;
    });

    await check("shared breadcrumbs on role pages", async () => {
      await page.goto(`${base}/dashboard/technician/bookings`);
      await page.getByRole("navigation", { name: "breadcrumb" }).getByRole("link", { name: "Technician workspace" }).waitFor();
      await page.setViewportSize({ width: 375, height: 812 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await login(page, testCredentials.customerEmail, testCredentials.customerPassword, "/dashboard/customer");
      await page.goto(`${base}/dashboard/customer/payments`);
      await page.getByRole("navigation", { name: "breadcrumb" }).getByRole("link", { name: "Bookings" }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.setViewportSize({ width: 1280, height: 800 });
    });

    await check("payment history API error and retry", async () => {
      await page.route("**/api/customer/payments", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Test payment history outage" }) }));
      await page.goto(`${base}/dashboard/customer/payments`);
      await page.getByRole("alert").getByText("Could not load your payments. Try again later.", { exact: false }).waitFor();
      await page.unroute("**/api/customer/payments");
      const response = page.waitForResponse((value) => value.url().endsWith("/api/customer/payments") && value.status() === 200);
      await page.getByRole("button", { name: "Retry" }).click();
      await response;
      await page.getByText("Could not load your payments. Try again later.", { exact: false }).waitFor({ state: "hidden" });
    });

    if (process.env.FIXITNOW_MUTATION_TESTS === "1") await check("technician availability add and block", async () => {
      const dateInput = (offset) => new Date(Date.now() + offset).toLocaleString("sv-SE", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).replace(" ", "T");
      const profileResponse = await page.request.get(`${base}/api/technician/profile`);
      assert.equal(profileResponse.status(), 200);
      const slots = (await profileResponse.json()).availabilitySlots;
      let offset = 31 * 86400000;
      while (slots.some((slot) => Math.abs(new Date(slot.startAt).getTime() - (Date.now() + offset)) < 2 * 3600000)) offset += 86400000;
      await page.locator("#slot-start").fill(dateInput(offset));
      await page.locator("#slot-end").fill(dateInput(offset + 3600000));
      const add = page.waitForResponse((response) => response.url().endsWith("/api/technician/availability") && response.request().method() === "PUT" && response.status() === 200);
      await page.getByRole("button", { name: "Add time" }).click();
      await add;
      const block = page.waitForResponse((response) => response.url().includes("/api/technician/availability/") && response.request().method() === "PATCH" && response.status() === 200);
      await page.getByRole("button", { name: "Block", exact: true }).first().click();
      await block;
    });
  } else console.log("SKIP technician and duplicate registration cases: set FIXITNOW_TEST_TECH_FILE");

  await check("public API outage boundary", async () => {
    if (backendProcess.exitCode === null) {
      backendProcess.kill();
      await new Promise((resolveExit) => backendProcess.once("exit", resolveExit));
    }
    await page.goto(`${base}/services?location=Dhaka`);
    await page.getByText("We could not load this page").waitFor({ timeout: 15000 });
    await page.getByRole("button", { name: "Try again" }).waitFor();
  });

  await check("cancel return does not claim payment", async () => {
    await page.goto(`${base}/payment/cancel`);
    await page.getByRole("heading", { name: "Checkout cancelled" }).waitFor();
    await page.getByText("No payment is confirmed by this page.", { exact: false }).waitFor();
  });

  await page.close();
} catch (error) {
  failures++;
  console.error(`FAIL local setup: ${error.message}; backend exit ${backendProcess.exitCode}; frontend exit ${frontendProcess.exitCode}`);
} finally {
  if (browser) await browser.close();
  backendProcess.kill();
  frontendProcess.kill();
}

if (failures) process.exitCode = 1;
