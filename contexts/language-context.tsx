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

function isSupportedLocale(value: string | undefined | null): value is Locale {
  return !!value && value in translations;
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";

  const stored = localStorage.getItem("fightlog-locale") as Locale | null;
  if (isSupportedLocale(stored)) return stored;

  const cookieMatch = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("fightlog-locale="));
  const cookieLocale = cookieMatch?.split("=")[1];
  if (isSupportedLocale(cookieLocale)) return cookieLocale;

  const detected = navigator.language.slice(0, 2) as Locale;
  return isSupportedLocale(detected) ? detected : "en";
}

export function LanguageProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return isSupportedLocale(initialLocale) ? initialLocale : "en";
    }

    const resolved = getInitialLocale();
    if (isSupportedLocale(resolved)) return resolved;
    return isSupportedLocale(initialLocale) ? initialLocale : "en";
  });

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
