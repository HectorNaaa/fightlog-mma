import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/contexts/language-context";
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
};

const SUPPORTED_LOCALES: Locale[] = ["en", "es", "pt", "fr", "it"];

function resolveInitialLocale(cookieValue: string | undefined): Locale {
  if (cookieValue && SUPPORTED_LOCALES.includes(cookieValue as Locale)) {
    return cookieValue as Locale;
  }
  return "en";
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localeCookie = cookies().get("fightlog-locale")?.value;
  const initialLocale = resolveInitialLocale(localeCookie);

  return (
    <html lang={initialLocale} className="dark">
      <body
        className={`${inter.variable} ${barlowCondensed.variable} bg-bg-primary text-beige-warm antialiased min-h-screen`}
      >
        <AuthProvider>
          <LanguageProvider initialLocale={initialLocale}>{children}</LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
