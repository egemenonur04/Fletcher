"use client";

import { Calculator, ClipboardList, GraduationCap, Layers, ListTodo, Timer, TrendingUp } from "lucide-react";
import SectionNav, { type NavGroup } from "@/components/layout/SectionNav";

const GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/study", label: "Study", icon: Timer, exact: true },
      { href: "/study/tasks", label: "Planner", icon: ListTodo },
      { href: "/study/modules", label: "Modules", icon: Layers },
      { href: "/study/review", label: "Review", icon: ClipboardList },
      { href: "/study/stats", label: "Stats", icon: TrendingUp },
      { href: "/study/ap", label: "APs", icon: GraduationCap },
      { href: "/study/gpa", label: "GPA", icon: Calculator },
    ],
  },
];

export default function StudySidebar() {
  return <SectionNav brand="Study" icon={GraduationCap} groups={GROUPS} />;
}
