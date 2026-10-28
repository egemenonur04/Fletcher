"use client";

import { Dumbbell, HeartPulse, LineChart, Salad } from "lucide-react";
import SectionNav, { type NavItem } from "@/components/layout/SectionNav";

const NAV_ITEMS: NavItem[] = [
  { href: "/self-care", label: "Diet", icon: Salad, exact: true },
  { href: "/self-care/exercise", label: "Exercise", icon: Dumbbell },
  { href: "/self-care/progress", label: "Progress", icon: LineChart },
];

export default function SelfCareSidebar() {
  return <SectionNav brand="Health" icon={HeartPulse} groups={[{ items: NAV_ITEMS }]} />;
}
