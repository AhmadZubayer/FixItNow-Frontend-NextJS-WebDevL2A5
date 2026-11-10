import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

let services = Array.from({ length: 65 }, (_, index) => ({
  id: `22222222-2222-4222-8222-${String(index + 1).padStart(12, "0")}`,
  title: `Service ${index + 1}`, technician: `Technician ${index + 1}`,
  isApproved: index === 1, isActive: index === 1, isCancelled: false,
}));
const send = (response, status, body) => { response.writeHead(status, { "content-type": "application/json" }); response.end(JSON.stringify(body)); };
const backend = createServer((request, response) => {
  if (request.url === "/health") return send(response, 200, { success: true });
  if (request.headers.authorization !== "Bearer valid-admin") return send(response, 403, { message: "Forbidden" });
  if (request.url === "/api/auth/me") return send(response, 200, { data: { role: "ADMIN", name: "Admin" } });
  if (request.url === "/api/admin/services") return send(response, 200, { data: services });
  if (request.url?.startsWith("/api/admin/services/") && request.method === "PATCH") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      const service = services.find((item) => item.id === request.url.split("/").at(-1));
      if (!service) return send(response, 404, { message: "Service not found" });
      const { action } = JSON.parse(body);
      if (action === "approve") { service.isApproved = true; service.isActive = true; }
      if (action === "reject") { service.isApproved = false; service.isActive = false; }
      if (action === "pause") service.isActive = false;
      if (action === "resume") service.isActive = true;
      if (action === "delete") services = services.filter((item) => item.id !== service.id);
      send(response, 200, { data: service });
    });
    return;
  }
  send(response, 404, { message: "Not found" });
});
await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
const portServer = createServer();
await new Promise((resolve) => portServer.listen(0, "127.0.0.1", resolve));
const port = portServer.address().port;
await new Promise((resolve) => portServer.close(resolve));
const base = `http://127.0.0.1:${port}`;
const frontend = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { env: { ...process.env, API_BASE_URL: `http://127.0.0.1:${backend.address().port}`, NEXT_TELEMETRY_DISABLED: "1" }, stdio: "ignore" });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch(`${base}/api/session/me`)).status === 401) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, "Frontend did not start");
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addCookies([{ name: "accessToken", value: "valid-admin", url: base }]);
  const page = await context.newPage();
  await page.goto(`${base}/dashboard/admin/services`);
  await page.getByRole("heading", { level: 1, name: "Services (65)", exact: true }).waitFor();
  assert.equal(await page.getByRole("navigation", { name: "Admin navigation" }).getByRole("link", { name: "Services", exact: true }).getAttribute("aria-current"), "page");
  assert.deepEqual(await page.locator("thead th").allTextContents(), ["Service name", "Offered by", "Verified", "Action"]);
  assert.equal(await page.locator("tbody tr").count(), 30);
  const first = page.getByRole("row").filter({ has: page.getByRole("cell", { name: /^Service 1(?:\s*Paused)?$/ }) });
  await first.getByRole("button", { name: "Approve", exact: true }).click();
  await first.getByText("Verified", { exact: true }).waitFor();
  assert.equal(services[0].isApproved, true);
  await first.getByRole("button", { name: /^Actions/ }).click();
  await page.getByRole("menuitem", { name: "Pause", exact: true }).click();
  await first.getByText("Paused", { exact: true }).waitFor();
  await page.getByRole("menu").waitFor({ state: "hidden" });
  await first.getByRole("button", { name: /^Actions/ }).click();
  await page.getByRole("menuitem", { name: "Resume", exact: true }).click();
  await first.getByText("Paused", { exact: true }).waitFor({ state: "hidden" });
  assert.equal(services[0].isActive, true);
  const fourth = page.getByRole("cell", { name: "Service 4", exact: true }).locator("..");
  await fourth.getByRole("button", { name: "Reject", exact: true }).click();
  await page.getByText("Service rejected.", { exact: true }).waitFor();
  assert.equal(services[3].isApproved, false);
  const second = page.getByRole("cell", { name: "Service 2", exact: true }).locator("..");
  await second.getByRole("button", { name: /^Actions/ }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  const confirm = page.getByRole("alertdialog");
  await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
  await confirm.waitFor({ state: "hidden" });
  assert.equal(services.length, 65);
  await second.getByRole("button", { name: /^Actions/ }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await confirm.getByRole("button", { name: "Delete service", exact: true }).click();
  await page.getByRole("heading", { name: "Services (64)", exact: true }).waitFor();
  assert.equal(services.length, 64);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  assert.equal(await page.locator("tbody tr").count(), 30);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  assert.equal(await page.locator("tbody tr").count(), 4);
  const search = page.getByPlaceholder("Search services", { exact: true });
  await search.fill("Service 65");
  await search.press("Enter");
  assert.equal(await page.locator("tbody tr").count(), 1);
  await page.getByText("Page 1 of 1", { exact: true }).waitFor();
  await search.fill("");
  await page.getByText("Page 1 of 3", { exact: true }).waitFor();
  await page.screenshot({ path: join(tmpdir(), "fixitnow-admin-services.png"), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: join(tmpdir(), "fixitnow-admin-services-mobile.png"), fullPage: true });
  assert.equal((await page.request.patch(`${base}/api/admin/services/not-an-id`, { data: { action: "approve" } })).status(), 400);
  assert.equal((await page.request.patch(`${base}/api/admin/services/${services[0].id}`, { data: { action: "unknown" } })).status(), 400);
  console.log("PASS admin Services: navigation, columns, verification, pause/resume, confirmed delete, search, 30-row pagination, and mobile width");
} finally {
  await browser?.close();
  if (frontend.exitCode === null) { frontend.kill(); await new Promise((resolve) => frontend.once("exit", resolve)); }
  await new Promise((resolve) => backend.close(resolve));
}
