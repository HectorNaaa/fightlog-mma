import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/contexts/language-context";
import { ThemeProvider, type Theme } from "@/contexts/theme-context";
import type { Locale } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fightlogapp.vercel.app"),
  title: "FightLog — Training Evolution",
  description:
    "The training operating system for athletes. Track sessions, skills, plans, and performance across any sport.",
  keywords: ["athlete", "training log", "sports performance", "coaching", "recovery"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FightLog",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7a1f2b",
  viewportFit: "cover" as const,
};

const SUPPORTED_LOCALES: Locale[] = ["en", "es", "pt", "fr", "it"];

function resolveInitialLocale(cookieValue: string | undefined): Locale {
  if (cookieValue && SUPPORTED_LOCALES.includes(cookieValue as Locale)) {
    return cookieValue as Locale;
  }
  return "en";
}

function resolveInitialTheme(cookieValue: string | undefined): Theme {
  return cookieValue === "light" ? "light" : "dark";
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const localeCookie = cookieStore.get("fightlog-locale")?.value;
  const initialLocale = resolveInitialLocale(localeCookie);
  const themeCookie = cookieStore.get("fightlog-theme")?.value;
  const initialTheme = resolveInitialTheme(themeCookie);

  return (
    <html lang={initialLocale} className={initialTheme} style={{ colorScheme: initialTheme }}>
      <body
        className={`${inter.variable} ${barlowCondensed.variable} bg-bg-primary text-beige-warm antialiased min-h-screen`}
      >
        <ThemeProvider initialTheme={initialTheme}>
          <AuthProvider>
            <LanguageProvider initialLocale={initialLocale}>{children}</LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

