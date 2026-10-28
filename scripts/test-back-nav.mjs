// The floating back button's destinations. A wrong parent sends someone to a 404 or, worse,
// back onto the page they just left (the finances index and the old vocabulary paths redirect).
//
// Run: node --experimental-strip-types --import ./scripts/alias.mjs scripts/test-back-nav.mjs
import {
  applyNavigation,
  decideBack,
  normalizePath,
  parentFallback,
  parseTrail,
  referrerPath,
  restoreTrail,
  sameDestination,
  shouldShowFloatingBack,
  BACK_OVERFLOW_PX,
  BACK_SCROLL_PX,
} from "../lib/back-nav.ts";

let pass = 0;
const failures = [];
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) pass++; else failures.push(`${label}\n    expected ${e}\n    got      ${a}`);
}
function ok(cond, label) { if (cond) pass++; else failures.push(label); }

const NOW = new Date("2026-10-25T12:00:00Z"); // 15:00 in Istanbul, still October
const MONTH_EDGE = new Date("2026-10-31T22:00:00Z"); // 01:00 on 1 Nov in Istanbul
const ORIGIN = "http://localhost:3000";

// ── paths ────────────────────────────────────────────────────────────────────

eq(normalizePath("/study/sat/"), "/study/sat", "a trailing slash is the same page");
eq(normalizePath("/study/sat?q=dune"), "/study/sat?q=dune", "search is kept");
eq(normalizePath("/study/sat#notes"), "/study/sat", "the hash is not a different page");
eq(normalizePath("//evil.com"), null, "a protocol-relative URL is not in-site");
eq(normalizePath("https://evil.com/study"), null, "an absolute URL is not in-site");
eq(normalizePath("http://portal.local/study"), null, "a full URL string is not accepted as a path");
eq(normalizePath("/study/sat/../../shopping"), "/shopping", "dot segments resolve before the path is stored");
ok(!normalizePath(""), "empty is not a path");
eq(referrerPath("http://localhost:3000/study/sat/", ORIGIN), "/study/sat", "a same-origin referrer");
eq(referrerPath("https://google.com/search?q=x", ORIGIN), null, "another site is not a back target");
eq(referrerPath("http://localhost:3000//evil.com", ORIGIN), null, "a same-origin URL that is not a path");
ok(sameDestination("/study/sat/", "/study/sat"), "trailing slash matches");
ok(!sameDestination("/study/sat", "/study/sat?q=1"), "a different search is a different page");

// ── the parent each page's own arrow uses ───────────────────────────────────

const parents = [
  ["/shopping/shop1", "/shopping"],
  ["/shopping/shop1/edit", "/shopping/shop1"],
  ["/shopping/new", "/shopping"],
  ["/shopping", "/"],
  ["/self-care", "/"],
  ["/study/sat/vocab/words", "/study/sat/vocab"],
  ["/study/sat/vocab/flashcards", "/study/sat/vocab"],
  ["/study/sat/vocab/quick", "/study/sat/vocab"],
  ["/study/sat/vocab", "/study/sat"],
  ["/study/sat/practice?ids=6b4c8a1e", "/study/sat"],
  ["/study/sat", "/study"],
  ["/study/ap", "/study"],
  ["/study/ucat", "/study"],
  ["/study", "/"],
  ["/finances/2026/10", "/"],
  ["/finances", "/"],
  ["/", null],
  ["/login", null],
];
for (const [href, parent] of parents) {
  eq(parentFallback(href, NOW), parent, `parent of ${href}`);
  if (parent) ok(parent !== href.split("?")[0] && parent !== href, `${href} does not fall back to itself`);
}
eq(parentFallback("/finances/log", NOW), "/finances/2026/10", "the logger's arrow goes to this month");
eq(parentFallback("/finances/log", MONTH_EDGE), "/finances/2026/11", "the month is Istanbul's, not UTC's");

// A direct open uses the parent, never history, and never the external site it came from.
let trail = restoreTrail(null, "/study/sat/vocab", "https://google.com/", ORIGIN);
eq(trail, { entries: ["/study/sat/vocab"], index: 0, depth: 0 }, "an external referrer starts a fresh trail");
eq(decideBack(trail, "/study/sat/vocab", NOW), { type: "href", href: "/study/sat" }, "direct open falls back to the section");

// Climbing keeps climbing. The second press must not return to the page just left.
trail = applyNavigation(trail, "/study/sat", "fallback");
eq(decideBack(trail, "/study/sat", NOW), { type: "href", href: "/study" }, "the next press climbs to Study");
trail = applyNavigation(trail, "/study", "fallback");
eq(decideBack(trail, "/study", NOW), { type: "href", href: "/" }, "Study climbs to the portal");
trail = applyNavigation(trail, "/", "fallback");
eq(decideBack(trail, "/", NOW), { type: "none" }, "the portal has nowhere further to go");

// In-site history wins over the parent, and a refresh keeps it.
trail = restoreTrail(null, "/", null, ORIGIN);
trail = applyNavigation(trail, "/study", "push");
trail = applyNavigation(trail, "/study/sat", "push");
trail = applyNavigation(trail, "/study/sat/vocab", "push");
eq(trail.depth, 3, "three in-site steps");
eq(decideBack(trail, "/study/sat/vocab", NOW), { type: "history" }, "arrived from the question bank, so step back");
const refreshed = restoreTrail(trail, "/study/sat/vocab", "https://google.com/", ORIGIN);
eq(refreshed, trail, "a refresh keeps the trail even when the referrer is external");
eq(decideBack(refreshed, "/study/sat/vocab", NOW), { type: "history" }, "after a refresh the previous page is still in history");

// A filter replaces the entry. Back still goes to the page before the list, once.
trail = applyNavigation(trail, "/study/sat", "pop");
trail = applyNavigation(trail, "/study/sat?q=dune", "replace");
eq(trail.entries, ["/", "/study", "/study/sat?q=dune", "/study/sat/vocab"], "replace edits the current page and leaves the forward one");
eq(trail.index, 2, "the filtered list is the current page");
eq(trail.depth, 2, "replace does not add a history step");
eq(decideBack(trail, "/study/sat?q=dune", NOW), { type: "history" }, "back from a filtered list is one step");

// Review dates are real visits: back returns to the day you came from, not to Study.
trail = restoreTrail(null, "/study", null, ORIGIN);
trail = applyNavigation(trail, "/study/sat", "push");
trail = applyNavigation(trail, "/study/sat?section=math", "push");
eq(decideBack(trail, "/study/sat?section=math", NOW), { type: "history" }, "the previous filter is the previous page");

// `/finances` redirects to the current month. Stepping onto it from that month loops.
trail = restoreTrail(null, "/", null, ORIGIN);
trail = applyNavigation(trail, "/finances", "push");
trail = applyNavigation(trail, "/finances/2026/10", "push");
eq(decideBack(trail, "/finances/2026/10", NOW), { type: "href", href: "/" }, "skip the finances index, it redirects back here");

// An old vocabulary path does the same.
trail = restoreTrail(null, "/", null, ORIGIN);
trail = applyNavigation(trail, "/study/sat-vocab", "push");
trail = applyNavigation(trail, "/study/sat/vocab", "push");
eq(decideBack(trail, "/study/sat/vocab", NOW), { type: "href", href: "/" }, "skip /study/sat-vocab, it redirects back here");
trail = restoreTrail(null, "/", null, ORIGIN);
trail = applyNavigation(trail, "/sat", "push");
trail = applyNavigation(trail, "/study/sat", "push");
eq(decideBack(trail, "/study/sat", NOW), { type: "href", href: "/" }, "skip /sat, it redirects back here");

// Login bounces a signed-out session straight back. Don't offer it.
trail = applyNavigation(restoreTrail(null, "/study", null, ORIGIN), "/login", "push");
eq(decideBack(trail, "/login", NOW), { type: "none" }, "login is not a back target");

// Depth zero means the browser's previous entry is not one of ours, even if a stale trail says so.
trail = { entries: ["/", "/study/sat/vocab"], index: 1, depth: 0 };
eq(decideBack(trail, "/study/sat/vocab", NOW), { type: "href", href: "/study/sat" }, "no in-site history steps uses the parent");

// A full navigation that continues from the page this tab already had open.
const stored = { entries: ["/", "/study/sat"], index: 1, depth: 1 };
trail = restoreTrail(stored, "/study/sat/vocab", "http://localhost:3000/study/sat", ORIGIN);
eq(trail.entries, ["/", "/study/sat", "/study/sat/vocab"], "a same-site referrer continues the trail");
eq(trail.depth, 2, "that full load is one more in-site step");

// The same load from another site drops the stale trail.
trail = restoreTrail(stored, "/study/sat/vocab", "https://google.com/", ORIGIN);
eq(trail, { entries: ["/study/sat/vocab"], index: 0, depth: 0 }, "external referrer drops a trail for a different page");

// Pop back, then forward, then somewhere unknown.
trail = { entries: ["/", "/study", "/study/sat"], index: 2, depth: 2 };
trail = applyNavigation(trail, "/study", "pop");
eq(trail, { entries: ["/", "/study", "/study/sat"], index: 1, depth: 1 }, "back lands on Study and keeps the forward page");
trail = applyNavigation(trail, "/study/sat", "pop");
eq(trail.index, 2, "forward returns to the question bank");
eq(trail.depth, 2, "forward restores the in-site depth");
trail = applyNavigation(trail, "/shopping", "pop");
eq(trail, { entries: ["/shopping"], index: 0, depth: 0 }, "a page the trail doesn't know starts fresh");

// A stored trail that has been tampered with.
eq(parseTrail("{"), null, "broken JSON is ignored");
eq(parseTrail(JSON.stringify({ entries: ["https://evil.com"], index: 0, depth: 1 })), null, "an external entry is rejected");
eq(parseTrail(JSON.stringify({ entries: ["/study"], index: 0, depth: 9 })), { entries: ["/study"], index: 0, depth: 0 }, "depth can't outrun the pages behind this one");
eq(parseTrail(null), null, "no stored trail");

// The trail doesn't grow without bound. Depth stays inside what was kept.
trail = restoreTrail(null, "/", null, ORIGIN);
for (let i = 0; i < 50; i++) trail = applyNavigation(trail, `/study/sat?n=${i}`, "push");
ok(trail.entries.length <= 40, "the trail keeps at most 40 pages");
ok(trail.depth <= trail.index, "depth stays within the pages still recorded");
eq(trail.entries[trail.index], "/study/sat?n=49", "the newest page is current");
eq(decideBack(trail, "/study/sat?n=49", NOW).type, "history", "a long session still steps back one page");

// ── when the button is on screen ────────────────────────────────────────────

ok(!shouldShowFloatingBack(0, 2000, true, false), "at the top the page's own arrow is still there");
ok(!shouldShowFloatingBack(BACK_SCROLL_PX, 2000, true, false), "just at the threshold the arrow is still in reach");
ok(shouldShowFloatingBack(BACK_SCROLL_PX + 1, 2000, true, false), "once that arrow has scrolled away, the button shows");
ok(!shouldShowFloatingBack(800, BACK_OVERFLOW_PX, true, false), "a short page never grows a second back control");
ok(!shouldShowFloatingBack(800, 2000, false, false), "nowhere to go, no button");
ok(!shouldShowFloatingBack(800, 2000, true, true), "a drawer or sheet covers the corner, so the button hides");

if (failures.length) {
  console.error(`${failures.length} failed, ${pass} passed\n`);
  for (const failure of failures) console.error(`FAIL ${failure}\n`);
  process.exit(1);
}
console.log(`${pass} passed`);
