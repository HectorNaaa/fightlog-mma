import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 min-h-screen bg-bg-primary">
        <div className="p-5 lg:p-7 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
