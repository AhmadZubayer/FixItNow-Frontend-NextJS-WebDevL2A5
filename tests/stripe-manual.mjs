import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const frontendDirectory = process.cwd();
const backendDirectory = resolve(frontendDirectory, "../FixItNow-backend-server");
const backendEnv = Object.fromEntries(readFileSync(resolve(backendDirectory, ".env"), "utf8").split(/\r?\n/).filter((line) => line.includes("=") && !line.startsWith("#")).map((line) => {
  const divider = line.indexOf("=");
  return [line.slice(0, divider), line.slice(divider + 1).replace(/^['"]|['"]$/g, "")];
}));
const fixturePath = process.env.FIXITNOW_TEST_CHECKOUT_FILE;
if (!fixturePath) throw new Error("Set FIXITNOW_TEST_CHECKOUT_FILE to a generated customer/booking fixture");
if (!backendEnv.STRIPE_SECRET_KEY?.startsWith("sk_test_")) throw new Error("Backend Stripe test mode is required");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
if (!fixture.bookingId || !fixture.customerEmail || !fixture.customerPassword) throw new Error("The test fixture is incomplete");

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
  throw new Error(`Local service did not start: ${new URL(url).pathname}`);
}

const backendPort = await availablePort();
let frontendPort = await availablePort();
while (frontendPort === backendPort) frontendPort = await availablePort();
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const backendUrl = `http://127.0.0.1:${backendPort}`;
const stripeCli = resolve(tmpdir(), "fixitnow-stripe-cli/node_modules/@stripe/cli/bin/shim.js");
const listenerEnvironment = { ...process.env, STRIPE_API_KEY: backendEnv.STRIPE_SECRET_KEY };
const listener = spawn(process.execPath, [stripeCli, "listen", "--forward-to", `${backendUrl}/api/payments/webhook`, "--events", "checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,refund.updated,refund.failed"], { env: listenerEnvironment, stdio: ["ignore", "pipe", "pipe"] });
let listenerOutput = "";
for (const stream of [listener.stdout, listener.stderr]) stream.on("data", (chunk) => { listenerOutput += chunk.toString(); });
let signingSecret;
for (let attempt = 0; attempt < 60; attempt++) {
  signingSecret = listenerOutput.match(/whsec_[A-Za-z0-9]+/)?.[0];
  if (signingSecret) break;
  if (listener.exitCode !== null) break;
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
}
if (!signingSecret) throw new Error("Stripe listener did not provide a signing secret");

const backendEnvironment = { ...process.env, ...backendEnv, NODE_ENV: "production", PORT: String(backendPort), APP_URL: frontendUrl, SERVER_URL: backendUrl, STRIPE_WEBHOOK_SECRET: signingSecret };
const frontendEnvironment = { ...process.env, NODE_ENV: "production", API_BASE_URL: backendUrl };
for (const key of ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "ADMIN_PASSWORD", "DATABASE_URL"]) delete frontendEnvironment[key];
const backend = spawn(process.execPath, ["dist/server.js"], { cwd: backendDirectory, env: backendEnvironment, stdio: "ignore" });
const frontend = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(frontendPort)], { cwd: frontendDirectory, env: frontendEnvironment, stdio: "ignore" });

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  backend.kill();
  frontend.kill();
  listener.kill();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

try {
  await Promise.all([waitFor(`${backendUrl}/api/categories`), waitFor(`${frontendUrl}/auth/login`)]);
  const login = await fetch(`${frontendUrl}/api/session/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: fixture.customerEmail, password: fixture.customerPassword }) });
  if (login.status !== 200) throw new Error(`Test customer login failed: ${login.status}`);
  const cookie = login.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
  const checkout = await fetch(`${frontendUrl}/api/customer/payments`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ bookingId: fixture.bookingId, provider: "STRIPE" }) });
  if (checkout.status !== 201) throw new Error(`Test Checkout creation failed: ${checkout.status}`);
  const { paymentId, checkoutUrl } = await checkout.json();
  if (!paymentId || !checkoutUrl?.startsWith("https://checkout.stripe.com/")) throw new Error("Stripe Checkout response is incomplete");
  writeFileSync(resolve(tmpdir(), "fixitnow-manual-checkout-state.json"), JSON.stringify({ bookingId: fixture.bookingId, paymentId, checkoutUrl, frontendUrl }), { mode: 0o600 });
  console.log(JSON.stringify({ ready: true, checkoutUrl, frontendUrl, backendPort, listenerSecretMatchedToBackend: true }));

  let lastStatus = "";
  for (let attempt = 0; attempt < 720 && !stopping; attempt++) {
    const payment = await fetch(`${frontendUrl}/api/customer/payments/${paymentId}`, { headers: { cookie } });
    const paymentData = payment.status === 200 ? await payment.json() : null;
    const booking = await fetch(`${frontendUrl}/api/customer/bookings/${fixture.bookingId}`, { headers: { cookie } });
    const bookingData = booking.status === 200 ? await booking.json() : null;
    const status = `${paymentData?.status ?? "unknown"}/${bookingData?.status ?? "unknown"}`;
    if (status !== lastStatus) {
      console.log(JSON.stringify({ paymentStatus: paymentData?.status ?? null, bookingStatus: bookingData?.status ?? null, listenerSawCompletedEvent: listenerOutput.includes("checkout.session.completed") }));
      lastStatus = status;
    }
    if (paymentData?.status === "COMPLETED" && ["PAID", "IN_PROGRESS", "COMPLETED"].includes(bookingData?.status)) break;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 5000));
  }
} finally {
  stop();
}
