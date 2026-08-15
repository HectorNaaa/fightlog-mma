"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useTheme } from "@/contexts/theme-context";

/**
 * Keeps language + theme preferences in sync with the user's account so
 * they're restored on any device/browser the user logs into (not just
 * relying on this device's cookie/localStorage). Renders nothing.
 */
export function SettingsSync() {
  const { user } = useAuth();
  const { locale, setLocale } = useLanguage();
  const { theme, setTheme } = useTheme();
  const appliedForUser = useRef<string | null>(null);
  const lastSyncedLocale = useRef<string | null>(null);
  const lastSyncedTheme = useRef<string | null>(null);

  // When a user logs in (or the session loads), apply their saved
  // preferences from the account if we haven't already for this user.
  useEffect(() => {
    if (!user) {
      appliedForUser.current = null;
      return;
    }
    if (appliedForUser.current === user.userId) return;
    appliedForUser.current = user.userId;

    if (user.locale && user.locale !== locale) setLocale(user.locale);
    if (user.theme && user.theme !== theme) setTheme(user.theme);
    lastSyncedLocale.current = user.locale ?? locale;
    lastSyncedTheme.current = user.theme ?? theme;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Persist locale changes to the account.
  useEffect(() => {
    if (!user) return;
    if (lastSyncedLocale.current === locale) return;
    lastSyncedLocale.current = locale;
    fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, user?.userId]);

  // Persist theme changes to the account.
  useEffect(() => {
    if (!user) return;
    if (lastSyncedTheme.current === theme) return;
    lastSyncedTheme.current = theme;
    fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, user?.userId]);

  return null;
}
