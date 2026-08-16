"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/i18n";

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
  const t = (en: string, es: string, pt: string, fr: string, it: string) => tr(locale, { en, es, pt, fr, it });
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
      if (!res.ok) setError(t("Could not load gyms.", "No se pudieron cargar los gimnasios.", "Não foi possível carregar as academias.", "Impossible de charger les salles.", "Impossibile caricare le palestre."));
    } catch {
      setError(t("Network error loading gyms.", "Error de red al cargar gimnasios.", "Erro de rede ao carregar academias.", "Erreur réseau lors du chargement des salles.", "Errore di rete durante il caricamento delle palestre."));
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
        setError(data.error ?? t("Could not create gym", "No se pudo crear el gimnasio", "Não foi possível criar a academia", "Impossible de créer la salle", "Impossibile creare la palestra"));
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
        <h1 className="font-condensed text-2xl font-black uppercase tracking-[0.14em] text-white">{t("Gyms", "Gimnasios", "Academias", "Salles", "Palestre")}</h1>
        <p className="mt-1 text-sm text-stone-light">{t("Find gyms, see who trains where, and claim your affiliation.", "Encuentra gimnasios, mira quién entrena dónde y reclama tu afiliación.", "Encontre academias, veja quem treina onde e reivindique sua afiliação.", "Trouvez des salles, voyez qui s'entraîne où et revendiquez votre affiliation.", "Trova palestre, scopri chi si allena dove e rivendica la tua affiliazione.")}</p>
      </header>

      <div className="rounded-xl border border-stone-border bg-bg-card p-4">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search gyms by name or city", "Buscar gimnasios por nombre o ciudad", "Buscar academias por nome ou cidade", "Rechercher des salles par nom ou ville", "Cerca palestre per nome o città")}
            className="flex-1 rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
          />
          <button
            onClick={() => load(search)}
            className="rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-burgundy-light"
          >
            {t("Search", "Buscar", "Buscar", "Rechercher", "Cerca")}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-stone-border bg-bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">{t("Add your gym", "Añade tu gimnasio", "Adicione sua academia", "Ajoutez votre salle", "Aggiungi la tua palestra")}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder={t("Gym name", "Nombre del gimnasio", "Nome da academia", "Nom de la salle", "Nome della palestra")}
            className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
          />
          <input
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            placeholder={t("City", "Ciudad", "Cidade", "Ville", "Città")}
            className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
          />
          <input
            value={form.postalCode}
            onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))}
            placeholder={t("Postal / ZIP code", "Código postal", "CEP", "Code postal", "CAP")}
            className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
          />
          <input
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder={t("Short description (optional)", "Descripción breve (opcional)", "Descrição breve (opcional)", "Description brève (facultatif)", "Breve descrizione (opzionale)")}
            className="rounded-lg border border-stone-border bg-bg-elevated px-3 py-2 text-sm text-white placeholder:text-stone-text focus:border-burgundy-light focus:outline-none"
          />
        </div>
        <button
          onClick={createGym}
          disabled={creating}
          className="mt-3 rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-burgundy-light disabled:opacity-60"
        >
          {creating ? t("Creating...", "Creando...", "Criando...", "Création...", "Creazione...") : t("Create Gym", "Crear gimnasio", "Criar academia", "Créer une salle", "Crea palestra")}
        </button>
      </div>

      {error && <div className="rounded-lg border border-burgundy/40 bg-burgundy/15 px-3 py-2 text-sm text-burgundy-light">{error}</div>}
      {loading && <div className="text-sm text-stone-text">{t("Loading gyms...", "Cargando gimnasios...", "Carregando academias...", "Chargement des salles...", "Caricamento palestre...")}</div>}

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
                  <p className="text-xs text-stone-light">{gym.city || t("Location not set", "Ubicación no definida", "Localização não definida", "Emplacement non défini", "Posizione non definita")}</p>
                  {gym.description && <p className="mt-1 text-xs text-stone-text">{gym.description}</p>}
                </div>
                <span className="rounded bg-bg-elevated px-2 py-1 text-[11px] uppercase tracking-wider text-stone-light">
                  {gym.memberCount} {gym.memberCount === 1 ? t("member", "miembro", "membro", "membre", "membro") : t("members", "miembros", "membros", "membres", "membri")}
                </span>
              </div>
            </Link>
          ))}
          {gyms.length === 0 && (
            <div className="rounded-xl border border-dashed border-stone-border bg-bg-card p-5 text-sm text-stone-text">
              {t("No gyms yet. Be the first to add yours above.", "Aún no hay gimnasios. Sé el primero en añadir el tuyo.", "Ainda não há academias. Seja o primeiro a adicionar a sua acima.", "Aucune salle pour le moment. Soyez le premier à ajouter la vôtre ci-dessus.", "Ancora nessuna palestra. Sii il primo ad aggiungere la tua sopra.")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
