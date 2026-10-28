import SatSidebar from "@/components/sat/SatSidebar";

// The SAT section's pages share the sidebar; the practice screen (app/sat/practice) sits outside
// this group so it can take the whole window, as Bluebook does.
export default function SatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <SatSidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
