import Link from "next/link";
import { BookMarked, HeartPulse, PenLine, Wallet, GraduationCap, ShoppingBag } from "lucide-react";
import { APP_TIME_ZONE } from "@/lib/dates";

const SECTIONS = [
  { href: "/sat", label: "SAT", description: "Official Question Bank in a Bluebook-style screen, and vocabulary", icon: PenLine },
  { href: "/study", label: "Study", description: "Sessions and the stats they level, APs, planner, GPA", icon: GraduationCap },
  { href: "/self-care", label: "Self Care", description: "Today's meal plan and water", icon: HeartPulse },
  { href: "/finances", label: "Finances", description: "Monthly budget, expenses and carryover", icon: Wallet },
  { href: "/library", label: "Library", description: "Manga, games, movies, comics and articles", icon: BookMarked },
  { href: "/shopping", label: "Shopping", description: "Shops you've tried — what was good and what wasn't", icon: ShoppingBag },
];

// Rendered per request so the dateline is today's, in the app's zone.
export const dynamic = "force-dynamic";

export default function PortalPage() {
  const dateline = new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(new Date());

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <header className="text-center">
            <h1 className="text-5xl sm:text-7xl tracking-tight text-gray-900">My Portal</h1>
            <div className="mt-4 masthead-rule" />
            <p className="py-2 text-xs uppercase tracking-wide text-gray-700">{dateline}</p>
            <div className="border-t border-gray-900" />
          </header>

          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-l border-t border-gray-200">
            {SECTIONS.map(({ href, label, description, icon: Icon }) => (
              <li key={href} className="border-r border-b border-gray-200">
                <Link href={href} className="group flex h-full flex-col gap-3 p-6 hover:bg-gray-50 transition-colors">
                  <Icon className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
                  <p className="text-2xl font-bold tracking-tight text-gray-900 group-hover:underline underline-offset-4 decoration-1">{label}</p>
                  <p className="text-[15px] leading-snug text-gray-600">{description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
