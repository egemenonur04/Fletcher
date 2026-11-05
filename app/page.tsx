import Link from "next/link";
import { HeartPulse, Wallet, GraduationCap, ShoppingBag } from "lucide-react";
import { APP_TIME_ZONE } from "@/lib/dates";

const SECTIONS = [
  { href: "/study", label: "Study", description: "APs and units, GPA, the SAT Question Bank and vocabulary, UCAT", icon: GraduationCap },
  { href: "/self-care", label: "Health", description: "Meal plan and water, workouts, Strava and progress", icon: HeartPulse },
  { href: "/finances", label: "Finances", description: "Monthly budget, expenses and carryover", icon: Wallet },
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
      <header className="theme-header px-4 sm:px-7 py-5">
        <h1 className="text-lg text-gray-900">My Portal</h1>
      </header>
      <p className="bb-banner">{dateline}</p>
      <main className="flex-1 px-4 sm:px-8 py-8 sm:py-12">
        <ul className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECTIONS.map(({ href, label, description, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="theme-tile group flex h-full flex-col gap-3 p-6 transition-shadow">
                <Icon className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                <p className="text-xl font-medium text-gray-900">{label}</p>
                <p className="text-[15px] leading-snug text-gray-600">{description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
