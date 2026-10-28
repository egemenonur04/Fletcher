// Talking to the SAT Suite Question Bank. Server-only. Pure rules live in lib/sat-qbank.ts.
//
// College Board serves the bank without a key: POST /digital/get-questions for a section's index,
// POST /digital/get-question {external_id} for a current item, and GET
// saic.collegeboard.org/disclosed/{ibn}.json for an older one. None of it is documented, so a
// change on their side shows up here as a SatBankError, not as a broken page.
//
// The index changes rarely and is big, so it is cached for half a day; a question body is cached
// for a month. Question HTML is cleaned (lib/sat-html.ts) before it is cached or sent.

import { unstable_cache } from "next/cache";
import { cleanQuestionHtml } from "@/lib/sat-html";
import {
  SECTION_QUERY, fromExternal, fromIbn, toStubs,
  type SatQuestion, type SatSection, type SatStub,
} from "@/lib/sat-qbank";

/** Overridable so the page can be tried against a local stand-in; production never sets them. */
const BANK_URL = (process.env.SAT_QBANK_BASE_URL ??
  "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank").replace(/\/$/, "");
const DISCLOSED_URL = (process.env.SAT_DISCLOSED_BASE_URL ?? "https://saic.collegeboard.org/disclosed").replace(/\/$/, "");

/** The bank's assessment id for the SAT (the PSATs have their own). */
const SAT_EVENT = 99;

export class SatBankError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request(url: string, body?: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
  } catch {
    throw new SatBankError("Couldn't reach the College Board question bank — try again in a minute.", 502);
  }
  if (res.status === 404) throw new SatBankError("The question bank doesn't have that question.", 404);
  if (res.status === 429) throw new SatBankError("The question bank is busy — wait a moment and try again.", 429);
  if (!res.ok) throw new SatBankError(`The question bank answered ${res.status}.`, 502);
  const json = await res.json().catch(() => undefined);
  if (json === undefined) throw new SatBankError("The question bank sent something that isn't JSON.", 502);
  return json;
}

const indexOf = unstable_cache(
  async (section: SatSection): Promise<SatStub[]> => {
    const { test, domains } = SECTION_QUERY[section];
    const rows = await request(`${BANK_URL}/digital/get-questions`, { asmtEventId: SAT_EVENT, test, domain: domains });
    const stubs = toStubs(rows, section);
    if (stubs.length === 0) throw new SatBankError("The question bank sent an empty list.", 502);
    return stubs;
  },
  ["sat-qbank-index-v1"],
  { revalidate: 12 * 3600, tags: ["sat-qbank"] },
);

/** Every question in a section, de-duplicated. */
export async function listStubs(section: SatSection): Promise<SatStub[]> {
  return indexOf(section);
}

/** Both sections' indexes, for finding a question by its id. */
async function allStubs(): Promise<SatStub[]> {
  const [rw, math] = await Promise.all([indexOf("rw"), indexOf("math")]);
  return [...rw, ...math];
}

const bodyOf = unstable_cache(
  async (stub: SatStub): Promise<SatQuestion> => {
    const question = stub.source.kind === "external"
      ? fromExternal(await request(`${BANK_URL}/digital/get-question`, { external_id: stub.source.key }) as Record<string, unknown>, stub)
      : fromIbn(await request(`${DISCLOSED_URL}/${encodeURIComponent(stub.source.key)}.json`), stub);
    if (!question) throw new SatBankError("The question bank sent that question without its text.", 502);
    return {
      ...question,
      stimulus: cleanQuestionHtml(question.stimulus),
      stem: cleanQuestionHtml(question.stem),
      options: question.options.map((o) => ({ ...o, html: cleanQuestionHtml(o.html) })),
      rationale: cleanQuestionHtml(question.rationale),
    };
  },
  ["sat-qbank-question-v1"],
  { revalidate: 30 * 24 * 3600, tags: ["sat-qbank"] },
);

/** One question, ready to show: text cleaned, key and explanation included. */
export async function getQuestion(id: string): Promise<SatQuestion> {
  const stub = (await allStubs()).find((s) => s.id === id);
  if (!stub) throw new SatBankError("The question bank doesn't have that question.", 404);
  return bodyOf(stub);
}
