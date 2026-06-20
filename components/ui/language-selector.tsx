"use client";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { LOCALES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 text-stone-text hover:text-beige-warm transition-colors",
          compact ? "text-xs" : "text-sm"
        )}
        aria-label="Select language"
        aria-controls={menuId}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span>{current.flag}</span>
        {!compact && <span className="uppercase tracking-wider">{current.code}</span>}
        <span className="text-[10px] opacity-50">▾</span>
      </button>

      {open && (
        <div id={menuId} role="menu" className="absolute right-0 top-full mt-1 w-40 overflow-hidden rounded-xl border border-white/10 bg-bg-secondary/80 py-1 shadow-2xl backdrop-blur-xl z-50">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { setLocale(l.code as Locale); setOpen(false); }}
              role="menuitemradio"
              aria-checked={locale === l.code}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors text-left",
                locale === l.code ? "text-beige-surface font-semibold" : "text-stone-text"
              )}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {locale === l.code && <span className="ml-auto text-burgundy text-[10px]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
