"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardBody } from "@/components/ui/card";
import { RatingDots } from "@/components/ui/badge";
import { formatDate, formatDateInput } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/i18n";

interface SparringSession {
  id: string;
  date: string;
  partnerStyle?: string | null;
  rounds?: number | null;
  roundLength?: number | null;
  dominantMoments?: string | null;
  mistakes?: string | null;
  bestTechniques?: string | null;
  techniquesFailed?: string | null;
  damageTaken?: number | null;
  cardioRating?: number | null;
  composureRating?: number | null;
  defenseRating?: number | null;
  overallRating?: number | null;
  lessons?: string | null;
}

const empty: Omit<SparringSession, "id"> = {
  date: formatDateInput(new Date()),
  partnerStyle: "",
  rounds: 3,
  roundLength: 5,
  dominantMoments: "",
  mistakes: "",
  bestTechniques: "",
  techniquesFailed: "",
  damageTaken: null,
  cardioRating: null,
  composureRating: null,
  defenseRating: null,
  overallRating: null,
  lessons: "",
};

export default function SparringPage() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const t = (en: string, es: string, pt: string, fr: string, it: string) => tr(locale, { en, es, pt, fr, it });
  const [sessions, setSessions] = useState<SparringSession[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SparringSession | null>(null);
  const [form, setForm] = useState<Omit<SparringSession, "id">>(empty);
  const [saving, setSaving] = useState(false);

  const isIntermediate = user?.level === "intermediate";

  const load = () =>
    fetch("/api/sparring").then((r) => r.json()).then((d) => setSessions(Array.isArray(d) ? d : []));

  useEffect(() => { if (isIntermediate) load(); }, [isIntermediate]);

  const save = async () => {
    setSaving(true);
    const url = editing ? `/api/sparring/${editing.id}` : "/api/sparring";
    const method = editing ? "PUT" : "POST";
    const payload = { ...form, rounds: form.rounds ? Number(form.rounds) : null, roundLength: form.roundLength ? Number(form.roundLength) : null, damageTaken: form.damageTaken ? Number(form.damageTaken) : null, cardioRating: form.cardioRating ? Number(form.cardioRating) : null, composureRating: form.composureRating ? Number(form.composureRating) : null, defenseRating: form.defenseRating ? Number(form.defenseRating) : null, overallRating: form.overallRating ? Number(form.overallRating) : null };
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await load();
    setOpen(false);
    setSaving(false);
  };

  const del = async (id: string) => {
    await fetch(`/api/sparring/${id}`, { method: "DELETE" });
    await load();
  };

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const openEdit = (s: SparringSession) => { setEditing(s); setForm({ ...s, date: formatDateInput(s.date) }); setOpen(true); };
  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };

  if (!isIntermediate) {
    return (
      <div>
        <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface mb-6">{t("Sparring Review", "Revisión de sparring", "Revisão de sparring", "Revue de sparring", "Revisione sparring")}</h1>
        <div className="border border-navy/30 bg-navy/10 rounded-sm p-6 text-center max-w-lg mx-auto mt-10">
          <div className="text-4xl mb-3 opacity-30">⬡</div>
          <div className="font-condensed text-xl font-bold uppercase tracking-widest text-navy-light mb-2">{t("Intermediate Feature", "Función intermedia", "Recurso intermediário", "Fonctionnalité intermédiaire", "Funzione intermedia")}</div>
          <p className="text-sm text-stone-text">{t("Sparring analysis is available for Intermediate Amateur fighters.", "El análisis de sparring está disponible para nivel intermedio.", "A análise de sparring está disponível para o nível intermediário.", "L'analyse de sparring est disponible pour le niveau intermédiaire.", "L'analisi dello sparring è disponibile per il livello intermedio.")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface">{t("Sparring Review", "Revisión de sparring", "Revisão de sparring", "Revue de sparring", "Revisione sparring")}</h1>
          <p className="text-sm text-stone-text mt-1">{sessions.length} {t("sessions logged", "sesiones registradas", "sessões registradas", "séances enregistrées", "sessioni registrate")}</p>
        </div>
        <Button onClick={openNew}>+ {t("Log Sparring", "Registrar sparring", "Registrar sparring", "Enregistrer sparring", "Registra sparring")}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sessions.length === 0 && (
          <div className="col-span-full p-10 text-center text-stone-text text-sm border border-stone-border/50 rounded-sm">
            {t("No sparring sessions yet.", "Aún no hay sesiones de sparring.", "Ainda não há sessões de sparring.", "Aucune séance de sparring pour le moment.", "Ancora nessuna sessione di sparring.")}
          </div>
        )}
        {sessions.map((s) => (
          <Card key={s.id}>
            <CardBody>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-stone-text">{formatDate(s.date)}</div>
                  <div className="font-semibold text-beige-surface">{s.partnerStyle || t("Unknown style", "Estilo desconocido", "Estilo desconhecido", "Style inconnu", "Stile sconosciuto")}</div>
                  <div className="text-xs text-stone-text mt-0.5">{s.rounds ?? "?"} {t("rounds", "asaltos", "rounds", "rounds", "round")} × {s.roundLength ?? "?"} min</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>{t("Edit", "Editar", "Editar", "Modifier", "Modifica")}</Button>
                  <Button variant="danger" size="sm" onClick={() => del(s.id)}>×</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                {s.cardioRating != null && <Rating label={t("Cardio", "Cardio", "Cardio", "Cardio", "Cardio")} value={s.cardioRating} />}
                {s.composureRating != null && <Rating label={t("Composure", "Compostura", "Compostura", "Sang-froid", "Compostezza")} value={s.composureRating} />}
                {s.defenseRating != null && <Rating label={t("Defense", "Defensa", "Defesa", "Défense", "Difesa")} value={s.defenseRating} />}
                {s.overallRating != null && <Rating label={t("Overall", "General", "Geral", "Général", "Generale")} value={s.overallRating} />}
              </div>
              {s.bestTechniques && (
                <div className="text-xs mb-1">
                  <span className="text-stone-text">{t("Best: ", "Mejor: ", "Melhor: ", "Meilleur : ", "Migliore: ")}</span>
                  <span className="text-amber">{s.bestTechniques}</span>
                </div>
              )}
              {s.mistakes && (
                <div className="text-xs mb-1">
                  <span className="text-stone-text">{t("Mistakes: ", "Errores: ", "Erros: ", "Erreurs : ", "Errori: ")}</span>
                  <span className="text-red-400">{s.mistakes}</span>
                </div>
              )}
              {s.lessons && (
                <div className="text-xs text-stone-text italic border-t border-stone-border/50 pt-2 mt-2">
                  {s.lessons}
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t("Edit Sparring", "Editar sparring", "Editar sparring", "Modifier sparring", "Modifica sparring") : t("Log Sparring Session", "Registrar sparring", "Registrar sparring", "Enregistrer une séance de sparring", "Registra sessione di sparring")} className="max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <Input label={t("Date", "Fecha", "Data", "Date", "Data")} type="date" value={form.date} onChange={f("date")} />
          <Input label={t("Partner Style", "Estilo del compañero", "Estilo do parceiro", "Style du partenaire", "Stile del partner")} value={form.partnerStyle ?? ""} onChange={f("partnerStyle")} placeholder={t("e.g. Boxer, Wrestler", "ej: Boxeador, Luchador", "ex: Boxeador, Lutador", "ex : Boxeur, Lutteur", "es: Pugile, Lottatore")} />
          <Input label={t("Rounds", "Asaltos", "Rounds", "Rounds", "Round")} type="number" min={1} value={form.rounds ?? ""} onChange={f("rounds")} />
          <Input label={t("Round Length (min)", "Duración del asalto (min)", "Duração do round (min)", "Durée du round (min)", "Durata round (min)")} type="number" min={1} value={form.roundLength ?? ""} onChange={f("roundLength")} />
          {(["cardioRating", "composureRating", "defenseRating", "overallRating"] as const).map((field) => {
            const labels: Record<string, [string, string, string, string, string]> = {
              cardioRating: ["Cardio", "Cardio", "Cardio", "Cardio", "Cardio"],
              composureRating: ["Composure", "Compostura", "Compostura", "Sang-froid", "Compostezza"],
              defenseRating: ["Defense", "Defensa", "Defesa", "Défense", "Difesa"],
              overallRating: ["Overall", "General", "Geral", "Général", "Generale"],
            };
            const [en, es, pt, fr, it] = labels[field];
            const label = t(en, es, pt, fr, it);
            return (
            <div key={field} className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{label} (1–10): {form[field] ?? 0}</label>
              <input title={field} type="range" min={1} max={10} value={form[field] ?? 5} onChange={f(field)} />
            </div>
          );})}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{t("Damage Taken", "Daño recibido", "Dano recebido", "Dégâts subis", "Danno subito")} (1–10): {form.damageTaken ?? 0}</label>
            <input title={t("Damage Taken", "Daño recibido", "Dano recebido", "Dégâts subis", "Danno subito")} type="range" min={0} max={10} value={form.damageTaken ?? 0} onChange={f("damageTaken")} />
          </div>
          <Textarea label={t("Dominant Moments", "Momentos dominantes", "Momentos dominantes", "Moments dominants", "Momenti dominanti")} value={form.dominantMoments ?? ""} onChange={f("dominantMoments")} rows={2} />
          <Textarea label={t("Mistakes", "Errores", "Erros", "Erreurs", "Errori")} value={form.mistakes ?? ""} onChange={f("mistakes")} rows={2} />
          <Textarea label={t("Best Techniques Landed", "Mejores técnicas conectadas", "Melhores técnicas aplicadas", "Meilleures techniques réussies", "Migliori tecniche riuscite")} value={form.bestTechniques ?? ""} onChange={f("bestTechniques")} rows={2} />
          <Textarea label={t("Techniques That Failed", "Técnicas que fallaron", "Técnicas que falharam", "Techniques ratées", "Tecniche fallite")} value={form.techniquesFailed ?? ""} onChange={f("techniquesFailed")} rows={2} />
          <Textarea label={t("Lessons for Next Session", "Lecciones para la próxima sesión", "Lições para a próxima sessão", "Leçons pour la prochaine séance", "Lezioni per la prossima sessione")} value={form.lessons ?? ""} onChange={f("lessons")} rows={3} className="col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setOpen(false)}>{t("Cancel", "Cancelar", "Cancelar", "Annuler", "Annulla")}</Button>
          <Button onClick={save} disabled={saving}>{saving ? t("Saving…", "Guardando…", "Salvando…", "Enregistrement…", "Salvataggio…") : t("Save", "Guardar", "Salvar", "Enregistrer", "Salva")}</Button>
        </div>
      </Modal>
    </div>
  );
}

function Rating({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-stone-text text-[10px] uppercase tracking-wider">{label}</div>
      <RatingDots value={value} />
    </div>
  );
}
