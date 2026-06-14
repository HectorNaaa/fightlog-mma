"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Locale } from "@/lib/i18n";

type AnyTranslations = (typeof translations)[Locale];

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: AnyTranslations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";

  const stored = localStorage.getItem("fightlog-locale") as Locale | null;
  if (stored && stored in translations) return stored;

  const detected = navigator.language.slice(0, 2) as Locale;
  return detected in translations ? detected : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem("fightlog-locale", locale);
    document.cookie = `fightlog-locale=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
