import Link from "next/link";
import { Calculator, GraduationCap, Library, Stethoscope } from "lucide-react";

const PARTS = [
  { href: "/study/ap", label: "APs", description: "Statistics, Computer Science A, Biology, Chemistry and Calculus BC, unit by unit", icon: GraduationCap },
  { href: "/study/gpa", label: "GPA", description: "Lessons, hours and marks for each half of the year", icon: Calculator },
  { href: "/study/sat", label: "SAT", description: "The official Question Bank in a Bluebook-style screen, and vocabulary", icon: Library },
  { href: "/study/ucat", label: "UCAT", description: "Official practice material and your practice-test scores", icon: Stethoscope },
];

export default function StudyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Study</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 border-l border-t border-gray-200">
        {PARTS.map(({ href, label, description, icon: Icon }) => (
          <li key={href} className="border-r border-b border-gray-200">
            <Link href={href} className="group flex h-full flex-col gap-3 p-6 bg-white hover:bg-gray-50 transition-colors">
              <Icon className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
              <p className="text-xl font-bold tracking-tight text-gray-900 group-hover:underline underline-offset-4 decoration-1">{label}</p>
              <p className="text-[15px] leading-snug text-gray-600">{description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
