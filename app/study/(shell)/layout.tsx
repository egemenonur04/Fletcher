import StudySidebar from "@/components/study/StudySidebar";

// Study's pages share the sidebar; the SAT practice screen (app/study/sat/practice) sits outside
// this group so it can take the whole window, as Bluebook does.

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <StudySidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
