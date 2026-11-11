import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../lib/technician-earnings.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { technicianEarnings } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const payments = [
  ["2026-11-10T17:59:00Z", "100.00", "COMPLETED"],
  ["2026-11-10T18:00:00Z", "200.00", "COMPLETED"],
  ["2026-11-08T18:00:00Z", "300.00", "COMPLETED"],
  ["2026-10-31T18:00:00Z", "400.00", "COMPLETED"],
  ["2026-11-11T01:00:00Z", "999.00", "REFUNDED"],
  ["2026-11-11T01:00:00Z", "999.00", "PENDING"],
  ["2026-11-30T18:00:00Z", "999.00", "COMPLETED"],
].map(([paidAt, technicianShare, status]) => ({ paidAt, technicianShare, status }));
const result = technicianEarnings(payments, new Date("2026-11-11T06:00:00Z"));
assert.equal(result.today, 200);
assert.equal(result.week, 600);
assert.equal(result.month, 1000);
assert.equal(result.daily[10].value, 200);
assert.equal(result.daily.length, 30);
const monday = technicianEarnings([
  { status: "COMPLETED", paidAt: "2026-11-08T17:59:00Z", technicianShare: "0.10" },
  { status: "COMPLETED", paidAt: "2026-11-08T18:00:00Z", technicianShare: "0.20" },
], new Date("2026-11-09T06:00:00Z"));
assert.equal(monday.week, 0.2);
assert.equal(monday.month, 0.3);
assert.equal(technicianEarnings([], new Date("2028-02-15T00:00:00Z")).daily.length, 29);
console.log("PASS technician earnings: Dhaka midnight, Monday week boundary, month boundary, refund/pending/future exclusion, cents and leap year");
