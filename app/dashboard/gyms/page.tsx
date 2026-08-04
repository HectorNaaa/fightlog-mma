"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

interface Gym {
  id: string;
  name: string;
  city?: string | null;
  postalCode?: string | null;
  description?: string | null;
  memberCount: number;
}

export default function GymsDirectoryPage() {
  const { locale } = useLanguage();
  const isEs = locale === "es";
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", postalCode: "", description: "" });

  const load = async (q = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gyms?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setGyms(res.ok && Array.isArray(data) ? data : []);
      if (!res.ok) setError(isEs ? "No se pudieron cargar los gimnasios." : "Could not load gyms.");
    } catch {
      setError(isEs ? "Error de red al cargar gimnasios." : "Network error loading gyms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createGym = async () => {
    if (!form.name.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          city: form.city || null,
          postalCode: form.postalCode || null,
          description: form.description || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? (isEs ? "No se pudo crear el gimnasio" : "Could not create gym"));
        return;
      }
      setForm({ name: "", city: "", postalCode: "", description: "" });
      await load(search);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-stone-border bg-bg-card p-5 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
        <h1 className="font-condensed text-2xl font-black uppercase tracking-[0.14em] text-white">{isEs ? "Gimnasios" : "Gyms"}</h1>
        <p className="mt-1 text-sm text-stone-light">{isEs ? "Encuentra gimnasios, mira quién entrena dónde y reclama tu afiliación." : "Find gyms, see who trains where, and claim your affiliation."}</p>
      </header>

      <div className="rounded-xl border border-stone-border bg-bg-card p-4">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isEs ? "Buscar gimnasios por nombre o ciudad" : "Search gyms by name or city"}
            className="flex-1 rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
          />
          <button
            onClick={() => load(search)}
            className="rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-burgundy-light"
          >
            {isEs ? "Buscar" : "Search"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-stone-border bg-bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{isEs ? "Añade tu gimnasio" : "Add your gym"}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder={isEs ? "Nombre del gimnasio" : "Gym name"}
            className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
          />
          <input
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            placeholder={isEs ? "Ciudad" : "City"}
            className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
          />
          <input
            value={form.postalCode}
            onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))}
            placeholder={isEs ? "Código postal" : "Postal / ZIP code"}
            className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
          />
          <input
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder={isEs ? "Descripción breve (opcional)" : "Short description (optional)"}
            className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
          />
        </div>
        <button
          onClick={createGym}
          disabled={creating}
          className="mt-3 rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-burgundy-light disabled:opacity-60"
        >
          {creating ? (isEs ? "Creando..." : "Creating...") : (isEs ? "Crear gimnasio" : "Create Gym")}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">{error}</div>}
      {loading && <div className="text-sm text-stone-text">{isEs ? "Cargando gimnasios..." : "Loading gyms..."}</div>}

      {!loading && (
        <div className="grid gap-3">
          {gyms.map((gym) => (
            <Link
              key={gym.id}
              href={`/dashboard/gyms/${gym.id}`}
              className="block rounded-xl border border-stone-border bg-bg-card p-4 transition-colors hover:border-burgundy-light"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{gym.name}</p>
                  <p className="text-xs text-stone-light">{gym.city || (isEs ? "Ubicación no definida" : "Location not set")}</p>
                  {gym.description && <p className="mt-1 text-xs text-stone-text">{gym.description}</p>}
                </div>
                <span className="rounded bg-bg-elevated px-2 py-1 text-[11px] uppercase tracking-wider text-stone-light">
                  {gym.memberCount} {isEs ? (gym.memberCount === 1 ? "miembro" : "miembros") : (gym.memberCount === 1 ? "member" : "members")}
                </span>
              </div>
            </Link>
          ))}
          {gyms.length === 0 && (
            <div className="rounded-xl border border-dashed border-stone-border bg-bg-card p-5 text-sm text-stone-text">
              {isEs ? "Aún no hay gimnasios. Sé el primero en añadir el tuyo." : "No gyms yet. Be the first to add yours above."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
