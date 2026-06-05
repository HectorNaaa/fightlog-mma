"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { DISCIPLINES, LEVELS } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    level: "beginner",
    discipline: "MMA",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Signup failed");
      setLoading(false);
      return;
    }
    await refetch();
    router.push("/dashboard");
  };

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-condensed font-black text-3xl tracking-[0.2em] text-beige-surface mb-1">
            FIGHT<span className="text-burgundy">LOG</span>
          </div>
          <p className="text-xs text-stone-text uppercase tracking-widest">Create your fighter profile</p>
        </div>

        <div className="bg-bg-card border border-stone-border rounded-sm p-6">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Full Name</label>
              <input type="text" required minLength={2} value={form.name} onChange={f("name")}
                className="bg-bg-elevated border border-stone-border rounded px-3 py-2 text-sm text-beige-warm placeholder:text-stone-text focus:outline-none focus:border-amber transition-colors"
                placeholder="Your name" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Email</label>
              <input type="email" required value={form.email} onChange={f("email")}
                className="bg-bg-elevated border border-stone-border rounded px-3 py-2 text-sm text-beige-warm placeholder:text-stone-text focus:outline-none focus:border-amber transition-colors"
                placeholder="you@example.com" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Password</label>
              <input type="password" required minLength={8} value={form.password} onChange={f("password")}
                className="bg-bg-elevated border border-stone-border rounded px-3 py-2 text-sm text-beige-warm placeholder:text-stone-text focus:outline-none focus:border-amber transition-colors"
                placeholder="Min 8 characters" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Primary Discipline</label>
              <select value={form.discipline} onChange={f("discipline")}
                className="bg-bg-elevated border border-stone-border rounded px-3 py-2 text-sm text-beige-warm focus:outline-none focus:border-amber transition-colors">
                {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Fighter Level</label>
              {LEVELS.map((l) => (
                <label key={l.value}
                  className={`flex items-center gap-3 p-3 border rounded-sm cursor-pointer transition-colors ${
                    l.disabled
                      ? "border-stone-border/30 opacity-40 cursor-not-allowed"
                      : form.level === l.value
                      ? "border-burgundy bg-burgundy/10"
                      : "border-stone-border hover:border-stone-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="level"
                    value={l.value}
                    checked={form.level === l.value}
                    onChange={f("level")}
                    disabled={l.disabled}
                    className="accent-burgundy"
                  />
                  <div>
                    <div className="text-sm font-semibold text-beige-warm">{l.label}</div>
                    {l.value === "beginner" && <div className="text-[11px] text-stone-text">Fundamentals, consistency, basic logs</div>}
                    {l.value === "intermediate" && <div className="text-[11px] text-stone-text">Sparring, gameplans, weekly reviews</div>}
                    {l.disabled && <div className="text-[11px] text-stone-text/60">Coming soon</div>}
                  </div>
                </label>
              ))}
            </div>
            {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/40 px-3 py-2 rounded">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-burgundy text-beige-surface font-bold uppercase tracking-widest text-sm py-2.5 rounded transition-colors hover:bg-burgundy-light disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create Fighter Profile"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-stone-text mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-amber hover:text-amber-light underline">Sign in</Link>
        </p>
        <p className="text-center text-xs text-stone-text mt-2">
          <Link href="/" className="text-stone-text hover:text-beige-warm">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
