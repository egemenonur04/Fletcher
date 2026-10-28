export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { COURSES, isSubtest, lessonId } from "@/lib/ucat-lessons";
import { listDoneLessons } from "@/lib/ucat-service";

export default async function UcatCoursePage({ params }: { params: Promise<{ subtest: string }> }) {
  const { subtest } = await params;
  if (!isSubtest(subtest)) notFound();
  const course = COURSES[subtest];
  const done = new Set((await listDoneLessons()) ?? []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/study/ucat" className="text-xs font-bold uppercase tracking-wide text-gray-600 hover:underline underline-offset-4">UCAT</Link>
        <h2 className="text-3xl font-bold text-gray-900 mt-1">{course.name}</h2>
        <p className="text-xs text-gray-500 mt-1">{course.questions} questions · {course.minutes} minutes</p>
        <p className="text-[17px] text-gray-700 mt-3">{course.intro}</p>
      </div>

      <ol className="border-t border-gray-900 divide-y divide-gray-200">
        {course.lessons.map((l, i) => {
          const finished = done.has(lessonId(subtest, l.slug));
          return (
            <li key={l.slug}>
              <Link href={`/study/ucat/${subtest}/${l.slug}`} className="group flex items-start gap-4 py-4">
                <span className="w-6 text-right font-bold tabular-nums text-gray-500">{i + 1}</span>
                <span className="flex-1">
                  <span className="block text-lg font-bold text-gray-900 group-hover:underline underline-offset-4 decoration-1">{l.title}</span>
                  <span className="block text-gray-600">{l.summary}</span>
                  <span className="block text-xs text-gray-500 mt-1">
                    {l.minutes} min · {l.examples.length + l.practice.length} question{l.examples.length + l.practice.length === 1 ? "" : "s"}
                  </span>
                </span>
                {finished && <Check className="w-5 h-5 mt-1 text-green-700" aria-label="Done" />}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
