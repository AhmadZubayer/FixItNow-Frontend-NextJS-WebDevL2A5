import assert from "node:assert/strict";
import { customerActivities } from "../lib/customer-activity.ts";

const bookings = [
  { id: "accepted", status: "ACCEPTED", createdAt: "2026-11-01T09:00:00Z", updatedAt: "2026-11-10T12:00:00Z" },
  { id: "completed", status: "COMPLETED", createdAt: "2026-11-02T09:00:00Z", review: { id: "review", rating: 5, comment: "Excellent", createdAt: "2026-11-10T13:00:00Z" } },
  { id: "cancelled", status: "CANCELLED", createdAt: "2026-11-03T09:00:00Z" },
];
const payments = [
  { id: "paid", status: "COMPLETED", createdAt: "2026-11-02T09:00:00Z", paidAt: "2026-11-10T11:00:00Z" },
  { id: "failed", status: "FAILED", createdAt: "2026-11-10T10:00:00Z" },
];
assert.deepEqual(customerActivities(bookings, payments).map(({ id }) => id), ["review-review", "booking-accepted", "payment-paid", "payment-failed", "booking-cancelled", "booking-completed"]);
assert.deepEqual(customerActivities(bookings, payments, "Bookings").map(({ id }) => id), ["booking-accepted", "booking-cancelled", "booking-completed"]);
assert.deepEqual(customerActivities(bookings, payments, "Payments").map(({ id }) => id), ["payment-paid", "payment-failed"]);
assert.deepEqual(customerActivities(bookings, payments, "Reviews").map(({ id }) => id), ["review-review"]);
const activities = customerActivities(bookings, payments);
assert.equal(activities.find(({ id }) => id === "booking-accepted").successful, true);
assert.equal(activities.find(({ id }) => id === "booking-cancelled").successful, false);
assert.equal(activities.find(({ id }) => id === "payment-failed").successful, false);
assert.equal(activities.find(({ id }) => id === "payment-paid").successful, true);
assert.deepEqual(customerActivities([], []), []);
assert.deepEqual(customerActivities([bookings[0]], [], "Reviews"), []);
assert.equal(bookings[0].id, "accepted", "Sorting must not mutate source data");
const refunded = { ...payments[0], status: "REFUNDED", updatedAt: "2026-11-10T14:00:00Z" };
assert.equal(customerActivities(bookings, [refunded])[0].date, refunded.updatedAt, "A later refund must sort by its latest update");
console.log("PASS customer activity ordering, latest timestamps, all four filters, icons, and empty states");
