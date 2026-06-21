"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSelector } from "@/components/ui/language-selector";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: t.sidebar.nav.dashboard, icon: "⬡", exact: true },
    { href: "/dashboard/training-log", label: t.sidebar.nav.trainingLog, icon: "◈" },
    { href: "/dashboard/community", label: t.sidebar.nav.community, icon: "◉" },
    { href: "/dashboard/technical-tracker", label: t.sidebar.nav.technical, icon: "◎" },
    { href: "/dashboard/gameplan", label: t.sidebar.nav.gameplan, icon: "◇" },
    { href: "/dashboard/physical-metrics", label: t.sidebar.nav.metrics, icon: "△" },
    { href: "/dashboard/sparring", label: t.sidebar.nav.sparring, icon: "⬡" },
    { href: "/dashboard/weekly-review", label: t.sidebar.nav.weeklyReview, icon: "□" },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 h-full z-40 w-56 bg-bg-secondary border-r border-stone-border flex-col">
      <div className="px-5 py-5 border-b border-stone-border">
        <Link href="/" className="block group">
          <div className="font-condensed font-black text-xl tracking-[0.2em] text-beige-surface group-hover:text-beige-warm transition-colors">
            FIGHT<span className="text-burgundy">LOG</span>
          </div>
        </Link>
        <div className="text-[10px] text-stone-text uppercase tracking-widest mt-0.5">
          {t.sidebar.subtitle}
        </div>
      </div>

      {user && (
        <div className="px-4 py-3 border-b border-stone-border/50">
          <div className="text-xs text-stone-text uppercase tracking-wider">{t.sidebar.fighter}</div>
          <div className="text-sm font-semibold text-beige-warm mt-0.5">{user.name}</div>
          <div className="mt-1">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm",
                user.level === "beginner" ? "bg-navy/30 text-navy-light" : "bg-burgundy/20 text-burgundy-light"
              )}
            >
              {user.level === "beginner" ? t.sidebar.beginner : t.sidebar.amateur}
            </span>
          </div>
        </div>
      )}

      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const active = (item as { exact?: boolean }).exact ? pathname === item.href : pathname.startsWith(item.href);
          const isLocked =
            user?.level === "beginner" &&
            ["/dashboard/gameplan", "/dashboard/sparring", "/dashboard/weekly-review"].includes(item.href);

          return (
            <Link
              key={item.href}
              href={isLocked ? "#" : item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-sm mb-0.5 text-sm font-medium transition-all group",
                active
                  ? "bg-burgundy/20 text-beige-surface border border-burgundy/30"
                  : isLocked
                  ? "text-stone-text/50 cursor-not-allowed"
                  : "text-stone-text hover:text-beige-warm hover:bg-bg-elevated"
              )}
            >
              <span className="text-base w-5 text-center opacity-70">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {isLocked && <span className="text-[9px] text-stone-text/50 uppercase tracking-wider">+</span>}
              {active && <span className="w-1 h-1 rounded-full bg-amber" />}
            </Link>
          );
        })}

        <div className="mt-3 mx-1 border border-stone-border/50 rounded-sm p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-text/60 mb-1">{t.sidebar.professionalMode}</div>
          <div className="text-[10px] text-stone-text/40 mb-2">{t.sidebar.comingSoon}</div>
          <div className="text-[9px] text-stone-text/40 uppercase tracking-wider">🔒 {t.sidebar.locked}</div>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-stone-border">
        <div className="flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="text-xs text-stone-text hover:text-beige-warm uppercase tracking-wider transition-colors"
          >
            {t.sidebar.logout}
          </button>
          <LanguageSelector compact />
        </div>
      </div>
    </aside>
  );
}