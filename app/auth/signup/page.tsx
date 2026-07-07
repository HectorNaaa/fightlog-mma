"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import Link from "next/link";
import { DISCIPLINES, LEVELS } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const { refetch, user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    level: "beginner",
    discipline: "General Training",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  const validate = () => {
    const nextErrors: Partial<Record<keyof typeof form, string>> = {};

    if (form.name.trim().length < 2) {
      nextErrors.name = "Name must have at least 2 characters";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email";
    }

    if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          level: form.level,
          discipline: form.discipline,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t.auth.signupFailed);
        return;
      }

      await refetch();
      router.push("/dashboard");
    } catch {
      setError(t.auth.networkError);
    } finally {
      setLoading(false);
    }
  };

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-bg-primary px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-stone-border/80 bg-[#1a1a1b] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.38)] sm:p-8">
          <div className="mb-6 text-center">
            <div className="font-condensed text-3xl font-black tracking-[0.2em] text-white">
              FIGHT<span className="text-burgundy-light">LOG</span>
            </div>
            <p className="mt-2 text-sm text-stone-light">Track sparring. Map weaknesses. Improve faster.</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-text">{t.auth.signupSub}</p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-light">{t.auth.name}</label>
              <input
                type="text"
                required
                minLength={2}
                autoComplete="name"
                value={form.name}
                onChange={f("name")}
                className="rounded-lg border border-stone-border bg-[#222224] px-3 py-2.5 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                placeholder={t.auth.namePlaceholder}
              />
              {fieldErrors.name && <p className="text-xs text-red-300">{fieldErrors.name}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-light">{t.auth.email}</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={f("email")}
                className="rounded-lg border border-stone-border bg-[#222224] px-3 py-2.5 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                placeholder="you@example.com"
              />
              {fieldErrors.email && <p className="text-xs text-red-300">{fieldErrors.email}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-light">{t.auth.password}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={f("password")}
                    className="w-full rounded-lg border border-stone-border bg-[#222224] px-3 py-2.5 pr-16 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                    placeholder={t.auth.passwordHint}
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

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-light">{t.auth.confirmPassword}</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={f("confirmPassword")}
                    className="w-full rounded-lg border border-stone-border bg-[#222224] px-3 py-2.5 pr-16 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-light hover:text-white"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <p className="text-xs text-red-300">{fieldErrors.confirmPassword}</p>}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-light">{t.auth.primarySport}</label>
                <select
                  value={form.discipline}
                  onChange={f("discipline")}
                  title={t.auth.primarySport}
                  className="rounded-lg border border-stone-border bg-[#222224] px-3 py-2.5 text-sm text-white focus:border-burgundy-light focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                >
                  {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-light">{t.auth.level}</label>
                <select
                  value={form.level}
                  onChange={f("level")}
                  title={t.auth.level}
                  className="rounded-lg border border-stone-border bg-[#222224] px-3 py-2.5 text-sm text-white focus:border-burgundy-light focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                >
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value} disabled={l.disabled}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-lg bg-burgundy px-4 py-2.5 text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-burgundy-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t.auth.creating : t.auth.createProfile}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-stone-light">
            {t.auth.hasAccount}{" "}
            <Link href="/auth/login" className="font-semibold text-burgundy-light hover:text-amber">{t.auth.loginLink}</Link>
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
