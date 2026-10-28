import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Libre_Franklin, Source_Serif_4 } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import FloatingBackButton from "@/components/layout/FloatingBackButton";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import "./globals.css";
// The look: the colour variables (generated), then type, corners and the shells' details.
// Imported here as their own stylesheets, after Tailwind's — see the note in globals.css.
import "./palette.css";
import "./design.css";

// Serif for text and headlines, Franklin for the furniture — see app/design.css.
const serif = Source_Serif_4({ subsets: ["latin", "latin-ext"], variable: "--font-serif" });
const franklin = Libre_Franklin({ subsets: ["latin", "latin-ext"], variable: "--font-franklin" });

export const metadata: Metadata = {
  title: "MyPortal",
  description: "Personal hub for all your apps and trackers.",
  appleWebApp: {
    capable: true,
    title: "Expenses",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#fafaf9",
  // Lets the layout extend under the notch / home indicator when installed.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${franklin.variable} h-full antialiased`}>
      <body className="min-h-screen bg-gray-50">
        {children}
        {/* Follows the query string, so it suspends on its own instead of the whole page. */}
        <Suspense fallback={null}>
          <FloatingBackButton />
        </Suspense>
        <ServiceWorkerRegistrar />
        <SpeedInsights />
      </body>
    </html>
  );
}
