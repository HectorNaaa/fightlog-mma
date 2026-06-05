"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      setLoading(false);
      return;
    }
    await refetch();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-condensed font-black text-3xl tracking-[0.2em] text-beige-surface mb-1">
            FIGHT<span className="text-burgundy">LOG</span>
          </div>
          <p className="text-xs text-stone-text uppercase tracking-widest">Sign in to your account</p>
        </div>

        <div className="bg-bg-card border border-stone-border rounded-sm p-6">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="bg-bg-elevated border border-stone-border rounded px-3 py-2 text-sm text-beige-warm placeholder:text-stone-text focus:outline-none focus:border-amber transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="bg-bg-elevated border border-stone-border rounded px-3 py-2 text-sm text-beige-warm placeholder:text-stone-text focus:outline-none focus:border-amber transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/40 px-3 py-2 rounded">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-burgundy text-beige-surface font-bold uppercase tracking-widest text-sm py-2.5 rounded transition-colors hover:bg-burgundy-light disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-stone-text mt-4">
          No account?{" "}
          <Link href="/auth/signup" className="text-amber hover:text-amber-light underline">
            Create one
          </Link>
        </p>
        <p className="text-center text-xs text-stone-text mt-2">
          <Link href="/" className="text-stone-text hover:text-beige-warm">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
