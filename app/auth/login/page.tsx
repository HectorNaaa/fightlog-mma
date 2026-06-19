"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch, user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const targetPath = searchParams.get("from") || "/dashboard";

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(targetPath);
    }
  }, [user, authLoading, router, targetPath]);

  const validate = () => {
    const nextErrors: { email?: string; password?: string } = {};
    const email = form.email.trim();

    if (!email) {
      nextErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "Please enter a valid email";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Password is required";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!validate()) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t.auth.loginFailed);
        return;
      }

      await refetch();
      router.push(targetPath);
    } catch {
      setError(t.auth.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-stone-border/80 bg-[#1a1a1b] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="mb-7 text-center">
            <div className="font-condensed text-3xl font-black tracking-[0.2em] text-white">
              FIGHT<span className="text-burgundy-light">LOG</span>
            </div>
            <p className="mt-2 text-sm text-stone-light">Train smarter. Build your fight brain.</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-text">{t.auth.loginSub}</p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-light">{t.auth.email}</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="rounded-lg border border-stone-border bg-[#222224] px-3 py-2.5 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                placeholder="you@example.com"
              />
              {fieldErrors.email && <p className="text-xs text-red-300">{fieldErrors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-light">{t.auth.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full rounded-lg border border-stone-border bg-[#222224] px-3 py-2.5 pr-16 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-light hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-300">{fieldErrors.password}</p>}
            </div>

            {error && <p className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-lg bg-burgundy px-4 py-2.5 text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-burgundy-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t.auth.signingIn : t.auth.login}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-stone-light">
            {t.auth.noAccount}{" "}
            <Link href="/auth/signup" className="font-semibold text-burgundy-light hover:text-amber">
              {t.auth.signupLink}
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-stone-text">Built by fighters, for fighters.</p>
          <p className="mt-3 text-center text-xs text-stone-text">
            <Link href="/" className="hover:text-white">{t.auth.backHome}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
