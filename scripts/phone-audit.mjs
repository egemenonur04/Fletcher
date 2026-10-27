// Visits every phone-facing route at 390×844 and reports:
//  - document scrollWidth past the viewport (sideways scroll)
//  - text fields under 16px (iOS zoom-on-focus)
//  - HTTP status other than 200
//
// Needs a running app (NEXT_URL, default http://127.0.0.1:3000), AUTH_PASSWORD, and a seeded DB.
import "dotenv/config";
import { chromium } from "playwright-core";

const BASE = process.env.NEXT_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROMIUM ?? "/usr/bin/google-chrome-stable";
const now = new Date();
const YEAR = now.getUTCFullYear();
const MONTH = now.getUTCMonth() + 1;

const ROUTES = [
  "/",
  "/login",
  "/library",
  "/library/movies",
  "/library/movies/new",
  "/library/movies/u/new",
  "/library/movies/m1",
  "/library/movies/m1/edit",
  "/library/movies/u/mu1",
  "/library/movies/u/mu1/edit",
  "/library/games",
  "/library/games/new",
  "/library/games/g1",
  "/library/games/g1/edit",
  "/library/manga",
  "/library/manga/new",
  "/library/manga/import",
  "/library/manga/mg1",
  "/library/manga/mg1/edit",
  "/library/comics",
  "/library/comics/new",
  "/library/comics/cp1",
  "/library/comics/cp1/edit",
  "/library/comics/cp1/new",
  "/library/comics/cp1/cu1",
  "/library/comics/cp1/cu1/edit",
  "/library/comics/cp1/cu1/new",
  "/library/comics/cp1/cu1/ct1",
  "/library/comics/cp1/cu1/ct1/edit",
  "/library/comics/cp1/cu1/ct1/new",
  "/library/comics/cp1/cu1/ct1/ci1",
  "/library/comics/cp1/cu1/ct1/ci1/edit",
  "/library/articles",
  "/library/articles/new",
  "/library/articles/ar1",
  "/library/articles/ar1/edit",
  "/study",
  "/study/tasks",
  "/study/modules",
  "/study/review",
  "/study/stats",
  "/study/ap",
  "/study/gpa",
  "/study/sat-vocab",
  "/study/sat-vocab/flashcards",
  "/study/sat-vocab/quick",
  "/study/sat-vocab/words",
  `/finances/${YEAR}/${MONTH}`,
  "/finances/log",
  "/shopping",
  "/shopping/new",
  "/shopping/sh1",
  "/shopping/sh1/edit",
  "/self-care",
];

async function measure(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const overflow = document.documentElement.scrollWidth - vw;
    const fields = [...document.querySelectorAll(
      'input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="range"]):not([type="hidden"]), select, textarea',
    )].filter((el) => {
      const size = parseFloat(getComputedStyle(el).fontSize);
      return size > 0 && size < 15.5;
    }).map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute("type") ?? "",
      name: el.getAttribute("name") ?? el.id ?? "",
      size: parseFloat(getComputedStyle(el).fontSize),
    }));
    return { overflow, fields, title: document.title };
  });
}

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();

  const login = await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  if (!login || login.status() >= 400) {
    throw new Error(`login page ${login?.status()}`);
  }
  await page.locator('input[type="password"]').fill(process.env.AUTH_PASSWORD ?? "phone-test");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });

  const failures = [];
  const fieldHits = [];
  let ok = 0;

  for (const route of ROUTES) {
    const res = await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const status = res?.status() ?? 0;
    if (status >= 400) {
      failures.push({ route, status, overflow: 0 });
      continue;
    }
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    const { overflow, fields } = await measure(page);
    if (overflow > 1) failures.push({ route, status, overflow: Math.round(overflow) });
    else ok++;
    for (const f of fields) fieldHits.push({ route, ...f });
  }

  await browser.close();

  console.log(`ok ${ok}/${ROUTES.length} routes`);
  if (failures.length) {
    console.log("OVERFLOW / HTTP");
    for (const f of failures) console.log(`  ${f.route}  status=${f.status}  extra=${f.overflow}px`);
  }
  if (fieldHits.length) {
    console.log("FIELDS < 16px");
    for (const f of fieldHits) console.log(`  ${f.route}  <${f.tag} type=${f.type} name=${f.name}> ${f.size}px`);
  }
  if (failures.length || fieldHits.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
