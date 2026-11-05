import { Noto_Serif, Roboto } from "next/font/google";

// The test screen's own two faces, loaded only here: the rest of the site never pays for them.
const serif = Noto_Serif({ subsets: ["latin", "latin-ext"], variable: "--font-bb-serif" });
const sans = Roboto({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "700"], variable: "--font-bb-sans" });

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${serif.variable} ${sans.variable}`}>{children}</div>;
}
