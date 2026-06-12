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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem("fightlog-locale") as Locale | null;
    if (stored && stored in translations) {
      setLocaleState(stored);
    } else {
      // Auto-detect from browser
      const lang = navigator.language.slice(0, 2) as Locale;
      if (lang in translations) setLocaleState(lang);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("fightlog-locale", l);
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
