import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const backendDirectory = resolve(process.cwd(), "../FixItNow-backend-server");
const backendEnv = Object.fromEntries(readFileSync(resolve(backendDirectory, ".env"), "utf8").split(/\r?\n/).filter((line) => line.includes("=") && !line.startsWith("#")).map((line) => {
  const divider = line.indexOf("=");
  return [line.slice(0, divider), line.slice(divider + 1).replace(/^['"]|['"]$/g, "")];
}));
const base = process.env.FIXITNOW_HOSTED_BACKEND;

if (!base?.startsWith("https://")) throw new Error("Set FIXITNOW_HOSTED_BACKEND to the verified HTTPS backend origin");
if (!backendEnv.ADMIN_EMAIL || !backendEnv.ADMIN_PASSWORD) throw new Error("Admin test credentials are missing from backend .env");

const login = await fetch(`${base}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: backendEnv.ADMIN_EMAIL, password: backendEnv.ADMIN_PASSWORD }),
});
assert.equal(login.status, 200, "Hosted admin login failed");
const body = await login.json();
const accessToken = body.data?.accessToken;
assert.ok(accessToken, "Hosted login did not return an access token");
const me = await fetch(`${base}/api/auth/me`, { headers: { authorization: `Bearer ${accessToken}` } });
assert.equal(me.status, 200, "Hosted session read failed");
const identity = await me.json();
assert.equal(identity.data?.role, "ADMIN", "Hosted test account is not an admin");
console.log(JSON.stringify({ loginStatus: login.status, meStatus: me.status, role: identity.data.role }));
