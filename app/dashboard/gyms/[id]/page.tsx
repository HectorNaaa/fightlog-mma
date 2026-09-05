"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/i18n";

interface GymMember {
  id: string;
  name: string;
  level: string;
  discipline: string;
  isPrimary: boolean;
  profile?: { username?: string; displayName?: string; beltRank?: string } | null;
}

interface GymDetail {
  id: string;
  name: string;
  city?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  isMember: boolean;
  members: GymMember[];
}

export default function GymProfilePage() {
  const params = useParams<{ id: string }>();
  const gymId = params?.id;
  const { locale } = useLanguage();
  const t = (en: string, es: string, pt: string, fr: string, it: string, uk: string) => tr(locale, { en, es, pt, fr, it, uk });

  const [gym, setGym] = useState<GymDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!gymId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gyms/${gymId}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error ?? t("Gym not found", "Gimnasio no encontrado", "Academia não encontrada", "Salle introuvable", "Palestra non trovata", "Залу не знайдено"));
        setGym(null);
        return;
      }
      setGym(data);
    } catch {
      setError(t("Network error loading gym.", "Error de red al cargar el gimnasio.", "Erro de rede ao carregar a academia.", "Erreur réseau lors du chargement de la salle.", "Errore di rete durante il caricamento della palestra.", "Помилка мережі під час завантаження зали."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId]);

  const performAction = async (action: "join" | "leave" | "setPrimary") => {
    if (!gymId || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/gyms/${gymId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="text-sm text-stone-text">{t("Loading gym profile...", "Cargando perfil del gimnasio...", "Carregando perfil da academia...", "Chargement du profil de la salle...", "Caricamento profilo palestra...", "Завантаження профілю зали...")}</div>;

  if (error || !gym) {
    return (
      <div className="rounded-xl border border-dashed border-stone-border bg-bg-card p-5 text-sm text-stone-text">
        {error || t("Gym not found.", "Gimnasio no encontrado.", "Academia não encontrada.", "Salle introuvable.", "Palestra non trovata.", "Залу не знайдено.")}{" "}
        <Link href="/dashboard/gyms" className="text-burgundy-light hover:underline">
          {t("Back to Gyms", "Volver a Gimnasios", "Voltar às academias", "Retour aux salles", "Torna alle palestre", "Назад до зал")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-stone-border bg-bg-card p-5 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
        <Link href="/dashboard/gyms" className="text-xs text-stone-text hover:text-white">
          {t("← Back to Gyms", "← Volver a Gimnasios", "← Voltar às academias", "← Retour aux salles", "← Torna alle palestre", "← Назад до зал")}
        </Link>
        <h1 className="mt-2 font-condensed text-2xl font-black uppercase tracking-[0.14em] text-white">{gym.name}</h1>
        <p className="mt-1 text-sm text-stone-light">{gym.city || t("Location not set", "Ubicación no definida", "Localização não definida", "Emplacement non défini", "Posizione non definita", "Місцезнаходження не вказано")}</p>
        {gym.description && <p className="mt-2 text-sm text-stone-text">{gym.description}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {gym.isMember ? (
            <>
              <span className="rounded-md border border-burgundy/50 bg-burgundy/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-burgundy-light">
                {t("You train here", "Entrenas aquí", "Você treina aqui", "Vous vous entraînez ici", "Ti alleni qui", "Ви тренуєтеся тут")}
              </span>
              <button
                onClick={() => performAction("setPrimary")}
                disabled={busy}
                className="rounded-md border border-stone-border bg-bg-elevated px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:border-burgundy-light disabled:opacity-60"
              >
                {t("Set as primary gym", "Marcar como gimnasio principal", "Definir como academia principal", "Définir comme salle principale", "Imposta come palestra principale", "Встановити як основну залу")}
              </button>
              <button
                onClick={() => performAction("leave")}
                disabled={busy}
                className="rounded-md border border-stone-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-light hover:text-white disabled:opacity-60"
              >
                {t("Leave gym", "Abandonar gimnasio", "Sair da academia", "Quitter la salle", "Lascia la palestra", "Покинути залу")}
              </button>
            </>
          ) : (
            <button
              onClick={() => performAction("join")}
              disabled={busy}
              className="rounded-md bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-burgundy-light disabled:opacity-60"
            >
              {t("Join this gym", "Unirte a este gimnasio", "Junte-se a esta academia", "Rejoindre cette salle", "Unisciti a questa palestra", "Приєднатися до цієї зали")}
            </button>
          )}
        </div>
      </header>

      <div className="rounded-xl border border-stone-border bg-bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-light">
          {t("Athletes", "Atletas", "Atletas", "Athlètes", "Atleti", "Спортсмени")} ({gym.members.length})
        </h3>
        <div className="mt-3 grid gap-2">
          {gym.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-stone-border/70 bg-bg-elevated p-3">
              <div>
                <p className="text-sm font-semibold text-white">{member.profile?.displayName || member.name}</p>
                <p className="text-xs text-stone-light">
                  {member.discipline} · {member.level}
                  {member.profile?.beltRank ? ` · ${member.profile.beltRank}` : ""}
                </p>
              </div>
              {member.isPrimary && (
                <span className="rounded bg-bg-card px-2 py-1 text-[11px] uppercase tracking-wider text-amber">{t("Primary", "Principal", "Principal", "Principale", "Principale", "Основний")}</span>
              )}
            </div>
          ))}
          {gym.members.length === 0 && (
            <p className="text-sm text-stone-text">{t("No athletes affiliated with this gym yet.", "Aún no hay atletas afiliados a este gimnasio.", "Ainda não há atletas afiliados a esta academia.", "Aucun athlète affilié à cette salle pour le moment.", "Ancora nessun atleta affiliato a questa palestra.", "До цієї зали ще не приєднано жодного спортсмена.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
