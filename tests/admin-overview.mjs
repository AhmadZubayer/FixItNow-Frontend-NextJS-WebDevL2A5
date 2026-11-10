import assert from "node:assert/strict";
import { summarizeMonth, monthChange } from "../lib/admin-overview.ts";

const result = summarizeMonth([
  { date: "2026-10-31T18:00:00Z", value: 1 },
  { date: "2026-11-08T00:00:00Z", value: 2 },
  { date: "2026-11-15T00:00:00Z", value: 3 },
  { date: "2026-11-22T00:00:00Z", value: 4 },
  { date: "2026-11-30T00:00:00Z", value: 5 },
  { date: "2026-10-31T17:59:59Z", value: 6 },
  { date: "2026-11-30T18:00:00Z", value: 100 },
  { date: "invalid", value: 100 },
], new Date("2026-11-30T17:59:59Z"));
assert.deepEqual(result.weeks.map((week) => week.value), [1, 2, 3, 9]);
assert.equal(result.total, 21);
assert.equal(result.thisMonth, 15);
assert.equal(result.lastMonth, 6);
assert.equal(result.today, 5);
assert.equal(result.weeks[3].label, "Days 22–30");
const january = summarizeMonth([
  { date: "2026-12-31T17:00:00Z", value: 4 },
  { date: "2026-12-31T18:00:00Z", value: 2 },
], new Date("2027-01-01T12:00:00Z"));
assert.equal(january.lastMonth, 4);
assert.equal(january.thisMonth, 2);
assert.equal(january.today, 2);
assert.equal(january.weeks[3].label, "Days 22–31");
assert.deepEqual(summarizeMonth([]).weeks.map((week) => week.value), [0, 0, 0, 0]);
assert.equal(monthChange(10, 5), "+5 (+100.0%) vs last month");
assert.equal(monthChange(5, 10), "−5 (−50.0%) vs last month");
assert.equal(monthChange(2, 0), "+2 vs last month");
assert.equal(monthChange(0, 0), "0 vs last month");
console.log("PASS overview month buckets, Dhaka boundaries, year rollover, and comparisons");
