export const dynamic = "force-dynamic";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import UcatLog from "@/components/study/UcatLog";
import { SUBTESTS, UCAT_NOT_READY } from "@/lib/ucat";
import { COURSES, SUBTEST_ORDER, lessonId } from "@/lib/ucat-lessons";
import { listDoneLessons, listUcatScores } from "@/lib/ucat-service";

// The UCAT's question banks and practice tests live on the official site, behind its own player;
// they have no public feed to draw questions from. So this page links to them and keeps the scores.
const LINKS = [
  { href: "https://practice.ucat.ac.uk/", label: "Official practice tests and question banks", note: "Free, timed like the real test, with answer rationales on the review screen." },
  { href: "https://www.ucat.ac.uk/", label: "UCAT website", note: "Test format, dates, booking, and the preparation toolkit." },
];

export default async function UcatPage() {
  const [scores, doneIds] = await Promise.all([listUcatScores(), listDoneLessons()]);
  const done = new Set(doneIds ?? []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">UCAT</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          The University Clinical Aptitude Test, for UK medicine and dentistry. Learn each subtest here,
          practise on the official material, then log your scores.
        </p>
      </div>

      <section>
        <h3 className="text-lg text-gray-900 border-b border-gray-900 pb-2">Learn</h3>
        <div className="grid sm:grid-cols-2 border-l border-gray-200">
          {SUBTEST_ORDER.map((key) => {
            const c = COURSES[key];
            const finished = c.lessons.filter((l) => done.has(lessonId(key, l.slug))).length;
            return (
              <Link key={key} href={`/study/ucat/${key}`} className="group block border-r border-b border-gray-200 p-4 hover:bg-white">
                <span className="block text-lg font-bold text-gray-900 group-hover:underline underline-offset-4 decoration-1">{c.name}</span>
                <span className="block text-sm text-gray-600 mt-1 line-clamp-2">{c.intro}</span>
                <span className="block text-xs text-gray-500 mt-2">
                  {c.lessons.length} lessons{doneIds === null ? "" : ` · ${finished} done`}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <ul className="border-t border-gray-900 divide-y divide-gray-200">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href} target="_blank" rel="noreferrer" className="group flex items-start gap-3 py-3">
              <ExternalLink className="w-4 h-4 mt-1 flex-shrink-0 text-gray-500" />
              <span>
                <span className="block text-[15px] text-gray-900 group-hover:underline underline-offset-4 decoration-1">{l.label}</span>
                <span className="block text-xs text-gray-500">{l.note}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <section>
        <h3 className="text-lg text-gray-900 border-b border-gray-900 pb-2">The four subtests</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-3 font-semibold">Subtest</th>
              <th className="py-2 pr-3 font-semibold text-right">Questions</th>
              <th className="py-2 pr-3 font-semibold text-right">Minutes</th>
              <th className="py-2 font-semibold text-right">Scored</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {SUBTESTS.map((t) => (
              <tr key={t.key}>
                <td className="py-2 pr-3">{t.name}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{t.questions}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{t.minutes}</td>
                <td className="py-2 text-right">{t.scale}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-gray-400">The format from 2025, after Abstract Reasoning was dropped. Check the UCAT website for the current year.</p>
      </section>

      {scores === null ? (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-700">{UCAT_NOT_READY}</p>
        </div>
      ) : (
        <UcatLog initial={scores} />
      )}
    </div>
  );
}
