"use client";

import { BookA, GalleryHorizontalEnd, Library, ListChecks, PenLine, Zap } from "lucide-react";
import SectionNav, { type NavGroup } from "@/components/layout/SectionNav";

const GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/sat", label: "Question Bank", icon: Library, exact: true },
    ],
  },
  {
    label: "Vocabulary",
    items: [
      { href: "/sat/vocab", label: "SAT Vocabulary", icon: BookA, exact: true },
      { href: "/sat/vocab/flashcards", label: "Flashcards", icon: GalleryHorizontalEnd },
      { href: "/sat/vocab/quick", label: "Quick test", icon: Zap },
      { href: "/sat/vocab/words", label: "Word list", icon: ListChecks },
    ],
  },
];

export default function SatSidebar() {
  return <SectionNav brand="SAT" icon={PenLine} groups={GROUPS} />;
}
