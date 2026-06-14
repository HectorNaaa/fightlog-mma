"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const DiaryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CommunityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MetricsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const TechnicalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 3l2.4 4.9L20 9l-4 3.9.9 5.6L12 15.9 7.1 18.5 8 13l-4-4 5.6-.9L12 3z" />
  </svg>
);

const PlanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M8 17v-4" />
    <path d="M12 17V8" />
    <path d="M16 17v-6" />
  </svg>
);

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: t.sidebar.nav.dashboard, icon: HomeIcon, exact: true },
    { href: "/dashboard/training-log", label: t.sidebar.nav.trainingLog, icon: DiaryIcon },
    { href: "/dashboard/community", label: t.sidebar.nav.community, icon: CommunityIcon },
    { href: "/dashboard/technical-tracker", label: t.sidebar.nav.technical, icon: TechnicalIcon },
    { href: "/dashboard/gameplan", label: t.sidebar.nav.gameplan, icon: PlanIcon },
    { href: "/dashboard/physical-metrics", label: t.sidebar.nav.metrics, icon: MetricsIcon },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-bg-secondary/70 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl safe-area-pb">
      <div className="mx-auto flex max-w-screen-md items-stretch gap-1 overflow-x-auto px-2 py-2">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-all",
                active
                  ? "text-beige-surface bg-burgundy/20 shadow-[0_0_0_1px_rgba(180,28,28,0.25)]"
                  : "text-stone-text hover:text-beige-warm"
              )}
            >
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition-all", active ? "border-burgundy/40 bg-burgundy/15 text-burgundy-light" : "border-white/10 bg-white/5 text-stone-text")}>
                <Icon />
              </span>
              <span className="whitespace-nowrap text-[9px] leading-none">{item.label}</span>
              {active && (
                <span className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-gradient-to-r from-transparent via-burgundy to-transparent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
