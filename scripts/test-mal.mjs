// MyAnimeList's image CDN. What decides whether it can be trusted: only https covers on MAL's own
// CDN are kept, and nothing that merely looks like it.
//
// Run: node --experimental-strip-types --import ./scripts/alias.mjs scripts/test-mal.mjs
import { malImage, isMalImage } from "../lib/mal.ts";

let pass = 0;
const failures = [];
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) pass++; else failures.push(`${label}\n    expected ${e}\n    got      ${a}`);
}
function ok(cond, label) { if (cond) pass++; else failures.push(label); }

eq(malImage("https://cdn.myanimelist.net/images/anime/1/1.jpg"), "https://cdn.myanimelist.net/images/anime/1/1.jpg", "MAL's CDN is kept");
for (const bad of ["http://cdn.myanimelist.net/a.jpg", "https://cdn.myanimelist.net.evil.io/a.jpg", "javascript:alert(1)", "", null, 7]) {
  eq(malImage(bad), null, `${JSON.stringify(bad)} is not a MAL image`);
}
ok(isMalImage("https://cdn.myanimelist.net/images/anime/1/1.jpg") && !isMalImage("https://image.tmdb.org/t/p/w500/a.jpg") && !isMalImage(null),
  "MAL posters are told apart from everything else");

if (failures.length) {
  console.error(`${pass} passed, ${failures.length} failed\n`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`${pass} passed, 0 failed`);
