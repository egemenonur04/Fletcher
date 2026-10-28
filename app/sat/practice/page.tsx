export const dynamic = "force-dynamic";

import Link from "next/link";
import BluebookPractice from "@/components/sat/BluebookPractice";
import { idsFrom, type SatQuestion } from "@/lib/sat-qbank";
import { getQuestion } from "@/lib/sat-qbank-service";
import { MAX_SET } from "@/lib/sat-attempt-schema";

type Search = Promise<Record<string, string | string[] | undefined>>;

/**
 * A practice set in a Bluebook-style screen, outside the SAT section's sidebar so it can take the
 * whole window. The questions are fetched (and cached) on the server; one the bank can't supply is
 * left out and counted, rather than failing the set.
 */
export default async function PracticePage({ searchParams }: { searchParams: Search }) {
  const raw = (await searchParams).ids;
  const ids = idsFrom(Array.isArray(raw) ? raw[0] : raw, MAX_SET);
  const settled = await Promise.allSettled(ids.map((id) => getQuestion(id)));
  const questions = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])) as SatQuestion[];

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl text-gray-900">No questions to show</h1>
        <p className="text-sm text-gray-500 mt-1">
          {ids.length === 0 ? "This practice link names no questions." : "The College Board question bank couldn't be reached, or doesn't have these questions."}
        </p>
        <Link href="/sat" className="mt-5 bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-semibold font-ui">Back to the Question Bank</Link>
      </div>
    );
  }

  return <BluebookPractice questions={questions} missing={ids.length - questions.length} />;
}
