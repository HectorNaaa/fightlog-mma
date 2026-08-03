"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function isTheme(value: string | undefined | null): value is Theme {
  return value === "dark" || value === "light";
}

function getInitialTheme(fallback: Theme): Theme {
  if (typeof window === "undefined") return fallback;

  const stored = localStorage.getItem("fightlog-theme");
  if (isTheme(stored)) return stored;

  const cookieMatch = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("fightlog-theme="));
  const cookieTheme = cookieMatch?.split("=")[1];
  if (isTheme(cookieTheme)) return cookieTheme;

  return fallback;
}

export function ThemeProvider({ children, initialTheme = "dark" }: { children: ReactNode; initialTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme(initialTheme));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    root.style.colorScheme = theme;
    localStorage.setItem("fightlog-theme", theme);
    document.cookie = `fightlog-theme=${theme}; path=/; max-age=31536000; samesite=lax`;
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
