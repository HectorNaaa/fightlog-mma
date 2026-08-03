"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  userId: string;
  email: string;
  name: string;
  locale?: "en" | "es" | "pt" | "fr" | "it";
  level: string;
  gymName?: string | null;
  todayFocus?: string | null;
  streak?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refetch: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // Keep the session alive while the app is open: periodically ping
    // /api/auth/me (which slides the cookie expiry forward) and refresh
    // whenever the tab regains focus/visibility after being idle.
    const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchUser(true);
      }
    }, REFRESH_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchUser(true);
      }
    };
    const handleFocus = () => fetchUser(true);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Keep local logout behavior predictable even if the network fails.
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
