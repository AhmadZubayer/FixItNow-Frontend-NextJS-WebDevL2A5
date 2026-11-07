import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

if (process.env.FIXITNOW_BOOKING_RACE_TEST !== "1") throw new Error("Set FIXITNOW_BOOKING_RACE_TEST=1 for a real database race test");
const backendDirectory = resolve(process.cwd(), "../FixItNow-backend-server");
const technician = JSON.parse(readFileSync(process.env.FIXITNOW_TEST_TECH_FILE, "utf8"));
const customer = JSON.parse(readFileSync(process.env.FIXITNOW_TEST_CUSTOMER_FILE, "utf8"));
const backendEnv = Object.fromEntries(readFileSync(resolve(backendDirectory, ".env"), "utf8").split(/\r?\n/).filter((line) => line.includes("=") && !line.startsWith("#")).map((line) => {
  const divider = line.indexOf("=");
  return [line.slice(0, divider), line.slice(divider + 1).replace(/^['"]|['"]$/g, "")];
}));
Object.assign(process.env, backendEnv);
const { default: app } = await import(pathToFileURL(resolve(backendDirectory, "dist/app.js")).href);
const server = await new Promise((resolveServer) => {
  const listening = app.listen(0, "127.0.0.1", () => resolveServer(listening));
});
const backendUrl = `http://127.0.0.1:${server.address().port}`;
let technicianToken;
let customerToken;
let slotId;
let bookingId;

async function api(method, path, body, token) {
  const response = await fetch(backendUrl + path, { method, headers: { ...(body ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  return { status: response.status, data: data.data };
}

try {
  const technicianLogin = await api("POST", "/api/auth/login", { email: technician.email, password: technician.password });
  const customerLogin = await api("POST", "/api/auth/login", { email: customer.customerEmail, password: customer.customerPassword });
  assert.equal(technicianLogin.status, 200);
  assert.equal(customerLogin.status, 200);
  technicianToken = technicianLogin.data.accessToken;
  customerToken = customerLogin.data.accessToken;
  assert.equal((await api("PATCH", `/api/technician/services/${technician.serviceId}`, { isActive: true }, technicianToken)).status, 200);
  const start = new Date(Date.now() + 160 * 86400000);
  const availability = await api("PUT", "/api/technician/availability", { slots: [{ startAt: start.toISOString(), endAt: new Date(start.getTime() + 3600000).toISOString() }] }, technicianToken);
  assert.equal(availability.status, 200);
  slotId = availability.data.find((slot) => new Date(slot.startAt).getTime() === start.getTime())?.id;
  assert.ok(slotId);
  const payload = { serviceId: technician.serviceId, availabilitySlotId: slotId };
  const results = await Promise.all([api("POST", "/api/bookings", payload, customerToken), api("POST", "/api/bookings", payload, customerToken)]);
  const statuses = results.map((result) => result.status).sort();
  bookingId = results.find((result) => result.status === 201)?.data?.id;
  assert.ok(bookingId);
  assert.deepEqual(statuses, [201, 409]);
  const cancelled = await api("PATCH", `/api/bookings/${bookingId}/cancel`, undefined, customerToken);
  assert.equal(cancelled.status, 200);
  bookingId = undefined;
  console.log(`RESULT:${JSON.stringify({ concurrentStatuses: statuses, cancellation: cancelled.status })}`);
} finally {
  if (bookingId && customerToken) await api("PATCH", `/api/bookings/${bookingId}/cancel`, undefined, customerToken).catch(() => {});
  if (technicianToken) {
    await api("PATCH", `/api/technician/services/${technician.serviceId}`, { isActive: false }, technicianToken).catch(() => {});
    if (slotId) await api("PATCH", `/api/technician/availability/${slotId}/block`, undefined, technicianToken).catch(() => {});
  }
  server.close();
}
