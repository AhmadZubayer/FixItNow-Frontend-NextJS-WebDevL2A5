import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const backendDirectory = resolve(process.cwd(), "../FixItNow-backend-server");
const backendRequire = createRequire(resolve(backendDirectory, "package.json"));
const Stripe = backendRequire("stripe");
const backendEnv = Object.fromEntries(readFileSync(resolve(backendDirectory, ".env"), "utf8").split(/\r?\n/).filter((line) => line.includes("=") && !line.startsWith("#")).map((line) => {
  const divider = line.indexOf("=");
  return [line.slice(0, divider), line.slice(divider + 1).replace(/^['"]|['"]$/g, "")];
}));

if (!backendEnv.STRIPE_SECRET_KEY?.startsWith("sk_test_")) throw new Error("Backend Stripe test mode is required");

const stripe = new Stripe(backendEnv.STRIPE_SECRET_KEY);
const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
console.log(JSON.stringify(endpoints.data.map((endpoint) => ({ url: endpoint.url, status: endpoint.status, enabledEvents: endpoint.enabled_events }))));
