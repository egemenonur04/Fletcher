import Link from "next/link";
import { BookMarked, HeartPulse, Wallet, GraduationCap, ShoppingBag, ArrowUpRight } from "lucide-react";

const SECTIONS = [
  { href: "/study", label: "Study", description: "Sessions and the stats they level, APs, planner, GPA", icon: GraduationCap },
  { href: "/self-care", label: "Self Care", description: "Today's meal plan and water", icon: HeartPulse },
  { href: "/finances", label: "Finances", description: "Monthly budget, expenses and carryover", icon: Wallet },
  { href: "/library", label: "Library", description: "Manga, games, movies, comics and articles", icon: BookMarked },
  { href: "/shopping", label: "Shopping", description: "Shops you've tried — what was good and what wasn't", icon: ShoppingBag },
];

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 px-4 sm:px-8 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm text-gray-500">Your personal hub</p>
          <h1 className="mt-2 text-4xl sm:text-6xl font-medium tracking-tight text-gray-900">My Portal</h1>

          <ul className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SECTIONS.map(({ href, label, description, icon: Icon }) => (
              <li key={href}>
                <Link href={href}
                  className="theme-tile group flex h-full flex-col justify-between gap-10 rounded-2xl border border-gray-200 p-6 sm:p-8 transition-colors">
                  <div className="flex items-start justify-between">
                    <Icon className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
                    <ArrowUpRight className="w-5 h-5 text-gray-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gray-900 motion-reduce:transition-none" />
                  </div>
                  <div>
                    <p className="text-xl font-medium tracking-tight text-gray-900">{label}</p>
                    <p className="mt-1 text-sm text-gray-500">{description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
