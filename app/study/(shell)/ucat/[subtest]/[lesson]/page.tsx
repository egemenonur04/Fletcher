export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import Blocks from "@/components/study/ucat/Blocks";
import DoneButton from "@/components/study/ucat/DoneButton";
import Question from "@/components/study/ucat/Question";
import { findLesson, lessonId } from "@/lib/ucat-lessons";
import { listDoneLessons } from "@/lib/ucat-service";

export default async function UcatLessonPage({ params }: { params: Promise<{ subtest: string; lesson: string }> }) {
  const { subtest, lesson: slug } = await params;
  const found = findLesson(subtest, slug);
  if (!found) notFound();
  const { course, lesson, index } = found;
  const id = lessonId(course.key, lesson.slug);
  const done = await listDoneLessons();
  const prev = course.lessons[index - 1];
  const next = course.lessons[index + 1];
  const base = `/study/ucat/${course.key}`;

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-600">
          <Link href="/study/ucat" className="hover:underline underline-offset-4">UCAT</Link>
          {" · "}
          <Link href={base} className="hover:underline underline-offset-4">{course.name}</Link>
          {" · "}Lesson {index + 1} of {course.lessons.length}
        </p>
        <h2 className="text-3xl font-bold text-gray-900 mt-1">{lesson.title}</h2>
        <p className="text-[17px] text-gray-700 mt-2">{lesson.summary}</p>
        <p className="text-xs text-gray-500 mt-1">About {lesson.minutes} minutes</p>
      </header>

      {lesson.sections.map((s) => (
        <section key={s.heading} className="space-y-3">
          <h3 className="text-xl font-bold text-gray-900 border-t border-gray-900 pt-3">{s.heading}</h3>
          <Blocks blocks={s.blocks} />
        </section>
      ))}

      {lesson.terms.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-gray-900 border-t border-gray-900 pt-3">Key terms</h3>
          <dl className="divide-y divide-gray-200">
            {lesson.terms.map((t) => (
              <div key={t.term} className="py-2 grid sm:grid-cols-[12rem_1fr] gap-1 sm:gap-4">
                <dt className="font-bold text-gray-900">{t.term}</dt>
                <dd className="text-gray-700">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {lesson.examples.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 border-t border-gray-900 pt-3">Worked examples</h3>
          {lesson.examples.map((q, i) => <Question key={q.id} question={q} worked label={`Example ${i + 1}`} />)}
        </section>
      )}

      {lesson.practice.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 border-t border-gray-900 pt-3">Practice</h3>
          <p className="text-sm text-gray-600">Answer first, then check — marked the way the real test marks it.</p>
          {lesson.practice.map((q, i) => <Question key={q.id} question={q} worked={false} label={`Question ${i + 1}`} />)}
        </section>
      )}

      <footer className="border-t border-gray-900 pt-4 space-y-4">
        <DoneButton lessonId={id} initial={done === null ? null : done.includes(id)} />
        <nav className="flex justify-between gap-4 text-sm">
          {prev ? <Link href={`${base}/${prev.slug}`} className="hover:underline underline-offset-4">← {prev.title}</Link> : <span />}
          {next ? (
            <Link href={`${base}/${next.slug}`} className="text-right hover:underline underline-offset-4">{next.title} →</Link>
          ) : (
            <Link href={base} className="text-right hover:underline underline-offset-4">Back to {course.name} →</Link>
          )}
        </nav>
      </footer>
    </article>
  );
}
