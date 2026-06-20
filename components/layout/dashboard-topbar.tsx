"use client";

import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSelector } from "@/components/ui/language-selector";

export function DashboardTopbar() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const isEs = locale === "es";

  return (
    <header className="sticky top-0 z-30 border-b border-stone-border/60 bg-bg-primary/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-stone-text">
            {isEs ? "Bienvenido" : "Welcome"}
          </p>
          <p className="truncate text-sm font-semibold text-beige-surface">
            {user?.name ? `${isEs ? "Hola" : "Hi"}, ${user.name}` : isEs ? "Hola" : "Hi"}
          </p>
        </div>
        <LanguageSelector />
      </div>
    </header>
  );
}
