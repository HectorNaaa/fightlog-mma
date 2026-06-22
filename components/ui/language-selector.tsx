"use client";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { LOCALES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (open) {
      document.addEventListener("keydown", onKeydown);
    }

    return () => document.removeEventListener("keydown", onKeydown);
  }, [open]);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const menuId = compact ? "language-menu-compact" : "language-menu";
  const buttonLabel = `${t.common.selectLanguage}: ${current.label}`;

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onPointerDown={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-white/10 bg-bg-elevated/80 text-stone-text transition-colors hover:border-stone-muted hover:text-beige-warm touch-manipulation",
          compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-2 text-sm"
        )}
        aria-label={buttonLabel}
        aria-controls={menuId}
        aria-haspopup="menu"
        title={buttonLabel}
      >
        <span>{current.flag}</span>
        <span className={cn("font-semibold uppercase tracking-wider", compact ? "text-[10px]" : "text-xs")}>{compact ? current.code : current.label}</span>
        {!compact && <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-beige-surface/80">{current.code}</span>}
        <span className="text-[10px] opacity-50">▾</span>
      </button>

      {open && (
        <div id={menuId} role="menu" className="absolute right-0 top-full mt-1 w-40 overflow-hidden rounded-xl border border-white/10 bg-bg-secondary/95 py-1 shadow-2xl backdrop-blur-xl z-[999]">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onPointerDown={(e) => { e.stopPropagation(); }}
              onClick={() => { setLocale(l.code as Locale); setOpen(false); }}
              role="menuitem"
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors text-left cursor-pointer select-none",
                locale === l.code
                  ? "bg-burgundy/15 text-beige-surface font-semibold ring-1 ring-inset ring-burgundy/30"
                  : "text-stone-text hover:bg-white/5 active:bg-white/10"
              )}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {locale === l.code && <span className="ml-auto rounded-full bg-burgundy/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-beige-surface">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
