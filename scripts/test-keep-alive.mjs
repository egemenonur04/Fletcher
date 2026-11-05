// The daily keep-alive's gate: Vercel Cron's `Authorization: Bearer <CRON_SECRET>`, failing closed,
// and a database failure reported as a 5xx so the cron run shows as failed.
//
// Run: node --experimental-strip-types --import ./scripts/alias.mjs scripts/test-keep-alive.mjs
import { keepAlive, KEEP_ALIVE_PATH } from "../lib/keep-alive.ts";

let pass = 0;
const failures = [];
function ok(cond, label) { if (cond) pass++; else failures.push(label); }

const SECRET = "p7Vd2kQ9xL4mZ8rT1yB6nC3fH0jW5sAe"; // 32 characters, a test fixture only
const bearer = (t) => `Bearer ${t}`;

let pings = 0;
const ping = async () => { pings++; return [{ "?column?": 1 }]; };
const down = async () => { throw new Error("tenant/user not found"); };

ok(KEEP_ALIVE_PATH === "/api/cron/keep-alive", "the path vercel.json calls");

let res = await keepAlive(null, SECRET, ping);
ok(res.status === 401, "no header: 401");
ok((await res.json()).error === "Unauthorized", "…with a JSON body");
ok(res.headers.get("cache-control") === "no-store", "…never cached");

ok((await keepAlive(bearer("x".repeat(32)), SECRET, ping)).status === 401, "a wrong secret: 401");
ok((await keepAlive(bearer(SECRET.slice(0, -1)), SECRET, ping)).status === 401, "a truncated secret: 401");
ok((await keepAlive(SECRET, SECRET, ping)).status === 401, "the secret without the Bearer scheme: 401");
ok((await keepAlive(bearer(SECRET), undefined, ping)).status === 401, "unset CRON_SECRET: nothing passes");
ok((await keepAlive(bearer(""), "", ping)).status === 401, "a blank CRON_SECRET and a blank header do not match");
ok((await keepAlive(bearer("short"), "short", ping)).status === 401, "a CRON_SECRET under 32 characters is refused");
ok(pings === 0, "a refused call never touches the database");

res = await keepAlive(bearer(SECRET), SECRET, ping);
ok(res.status === 200, "the right secret: 200");
const body = await res.json();
ok(body.ok === true && typeof body.at === "string", "…with { ok: true, at }");
ok(res.headers.get("cache-control") === "no-store", "…never cached");
ok(pings === 1, "…after exactly one query");

const quiet = console.error;
console.error = () => {};
res = await keepAlive(bearer(SECRET), SECRET, down);
console.error = quiet;
ok(res.status === 503, "the database down: 503, so the cron run fails");
const failed = await res.json();
ok(failed.ok === false, "…with ok: false");
ok(!JSON.stringify(failed).includes("tenant"), "…and no database detail");

if (failures.length) {
  console.error(`${pass} passed, ${failures.length} failed\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`${pass} passed, 0 failed`);
