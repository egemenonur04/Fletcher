export const dynamic = "force-dynamic";

import Link from "next/link";
import BankFilters from "@/components/sat/BankFilters";
import StartPractice from "@/components/sat/StartPractice";
import { latestResults, type QuestionStatus } from "@/lib/sat-attempt-service";
import {
  DIFFICULTY_LABELS, DOMAIN_LABELS, SECTION_LABELS, filterStubs, skillsOf,
  type SatSection, type SatStub,
} from "@/lib/sat-qbank";
import { SatBankError, listStubs } from "@/lib/sat-qbank-service";

const PAGE_SIZE = 50;

const STATUS_LABELS: Record<QuestionStatus, string> = { new: "Not tried", correct: "Right", incorrect: "Wrong" };

type Search = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function QuestionBankPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const section: SatSection = one(params.section) === "math" ? "math" : "rw";

  let stubs: SatStub[];
  try {
    stubs = await listStubs(section);
  } catch (e) {
    if (!(e instanceof SatBankError)) throw e;
    return (
      <Shell section={section}>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-700">{e.message}</p>
          <p className="text-xs text-gray-500 mt-1">The questions come from College Board&apos;s SAT Suite Question Bank.</p>
        </div>
      </Shell>
    );
  }

  const results = await latestResults();
  const skills = skillsOf(stubs);
  // A filter that names nothing in this section is ignored rather than emptying the list.
  const domain = one(params.domain) in DOMAIN_LABELS && stubs.some((s) => s.domain === one(params.domain)) ? one(params.domain) : "";
  const skill = skills.some((s) => s.skill === one(params.skill) && (!domain || s.domain === domain)) ? one(params.skill) : "";
  const difficulty = one(params.difficulty) in DIFFICULTY_LABELS ? one(params.difficulty) : "";
  const statusParam = one(params.status);
  const status = statusParam === "new" || statusParam === "correct" || statusParam === "incorrect" ? statusParam : "";

  const statusOf = (id: string): QuestionStatus => results.get(id) ?? "new";
  const filtered = filterStubs(stubs, { domain, skill, difficulty })
    .filter((s) => !status || statusOf(s.id) === status)
    .sort((a, b) => (a.band ?? 0) - (b.band ?? 0) || a.id.localeCompare(b.id));

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Number.parseInt(one(params.page), 10) || 1));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const tried = stubs.filter((s) => results.has(s.id));
  const right = tried.filter((s) => results.get(s.id) === "correct").length;

  const query = (extra: Record<string, string>) => {
    const q = new URLSearchParams({ section, domain, skill, difficulty, status, ...extra });
    for (const [k, v] of [...q.entries()]) if (!v) q.delete(k);
    return `/sat?${q.toString()}`;
  };

  return (
    <Shell section={section}>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm text-gray-600 border-b border-gray-200 pb-3">
        <span><strong className="text-gray-900">{stubs.length.toLocaleString("en-GB")}</strong> questions</span>
        <span><strong className="text-gray-900">{tried.length}</strong> tried</span>
        <span><strong className="text-gray-900">{tried.length ? Math.round((right / tried.length) * 100) : 0}%</strong> right last time</span>
      </div>

      <BankFilters
        section={section}
        domains={Object.keys(DOMAIN_LABELS).filter((d) => stubs.some((s) => s.domain === d)).map((d) => ({ value: d, label: DOMAIN_LABELS[d] }))}
        skills={skills.filter((s) => !domain || s.domain === domain).map((s) => ({ value: s.skill, label: s.name }))}
        value={{ domain, skill, difficulty, status }}
      />

      <StartPractice ids={filtered.map((s) => s.id)} />

      <section aria-label="Questions">
        <div className="flex items-baseline justify-between border-b border-gray-900 pb-2">
          <h3 className="text-lg text-gray-900">{filtered.length.toLocaleString("en-GB")} matching</h3>
          {pageCount > 1 && <span className="text-xs text-gray-500">Page {page} of {pageCount}</span>}
        </div>
        {shown.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">No questions match these filters.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {shown.map((s) => (
              <li key={s.id}>
                <Link href={`/sat/practice?ids=${s.id}`} className="group flex items-center gap-4 py-3 hover:bg-white">
                  <span className="w-20 flex-shrink-0 font-mono text-xs text-gray-500">{s.id}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] text-gray-900 truncate group-hover:underline underline-offset-4 decoration-1">{s.skillName || DOMAIN_LABELS[s.domain]}</span>
                    <span className="block text-xs text-gray-500 truncate">{DOMAIN_LABELS[s.domain] ?? s.domain}</span>
                  </span>
                  <span className="hidden sm:block w-16 text-xs text-gray-600">{s.difficulty ? DIFFICULTY_LABELS[s.difficulty] : "—"}</span>
                  <span className={`w-16 text-right text-xs ${
                    statusOf(s.id) === "correct" ? "text-green-700" : statusOf(s.id) === "incorrect" ? "text-red-700" : "text-gray-400"
                  }`}>{STATUS_LABELS[statusOf(s.id)]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {pageCount > 1 && (
          <nav className="flex justify-between pt-4 text-sm" aria-label="Pages">
            {page > 1 ? <Link href={query({ page: String(page - 1) })} className="underline underline-offset-4">Previous</Link> : <span />}
            {page < pageCount ? <Link href={query({ page: String(page + 1) })} className="underline underline-offset-4">Next</Link> : <span />}
          </nav>
        )}
      </section>

      <p className="text-xs text-gray-400">
        Questions from College Board&apos;s{" "}
        <a href="https://satsuitequestionbank.collegeboard.org/" target="_blank" rel="noreferrer" className="underline">SAT Suite Question Bank</a>.
      </p>
    </Shell>
  );
}

function Shell({ section, children }: { section: SatSection; children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Question Bank</h2>
        <p className="text-sm text-gray-500 mt-0.5">Official SAT questions. Pick a set and solve it in a Bluebook-style screen.</p>
      </div>
      <nav className="flex gap-6 border-b border-gray-200" aria-label="Section">
        {(["rw", "math"] as const).map((s) => (
          <Link key={s} href={`/sat?section=${s}`} aria-current={s === section ? "page" : undefined}
            className={`-mb-px pb-2 text-sm font-semibold border-b-2 ${s === section ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
            {SECTION_LABELS[s]}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
