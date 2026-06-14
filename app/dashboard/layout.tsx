import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-56 pt-4 lg:pt-0 pb-28 lg:pb-0 min-h-screen bg-bg-primary">
        <div className="p-4 lg:p-7 max-w-4xl mx-auto">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
