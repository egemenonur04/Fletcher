"use client";

import { BookA, Calculator, GalleryHorizontalEnd, GraduationCap, LayoutGrid, Library, ListChecks, Stethoscope, Zap } from "lucide-react";
import SectionNav, { type NavGroup } from "@/components/layout/SectionNav";

const GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/study", label: "Overview", icon: LayoutGrid, exact: true },
      { href: "/study/ap", label: "APs", icon: GraduationCap },
      { href: "/study/gpa", label: "GPA", icon: Calculator },
    ],
  },
  {
    label: "SAT",
    items: [
      { href: "/study/sat", label: "Question Bank", icon: Library, exact: true },
      { href: "/study/sat/vocab", label: "SAT Vocabulary", icon: BookA, exact: true },
      { href: "/study/sat/vocab/flashcards", label: "Flashcards", icon: GalleryHorizontalEnd },
      { href: "/study/sat/vocab/quick", label: "Quick test", icon: Zap },
      { href: "/study/sat/vocab/words", label: "Word list", icon: ListChecks },
    ],
  },
  {
    label: "UCAT",
    items: [
      { href: "/study/ucat", label: "UCAT", icon: Stethoscope },
    ],
  },
];

export default function StudySidebar() {
  return <SectionNav brand="Study" icon={GraduationCap} groups={GROUPS} />;
}
