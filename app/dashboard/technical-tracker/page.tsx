"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardBody } from "@/components/ui/card";
import { RatingDots } from "@/components/ui/badge";
import { STRIKING_TECHNIQUES, GRAPPLING_TECHNIQUES } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { tr, type Locale } from "@/lib/i18n";
import GameplanPage from "@/app/dashboard/gameplan/page";

interface Technique {
  id: string;
  category: string;
  name: string;
  setup?: string | null;
  counter?: string | null;
  commonMistake?: string | null;
  successRate?: number | null;
  confidence?: number | null;
  notes?: string | null;
  videoUrl?: string | null;
}

const emptyTech: Omit<Technique, "id"> = {
  category: "striking",
  name: "",
  setup: "",
  counter: "",
  commonMistake: "",
  successRate: null,
  confidence: 5,
  notes: "",
  videoUrl: "",
};

export default function TechnicalTrackerPage() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const t = (en: string, es: string, pt: string, fr: string, it: string) => tr(locale, { en, es, pt, fr, it });
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [tab, setTab] = useState<"striking" | "grappling" | "gameplans">("striking");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Technique | null>(null);
  const [form, setForm] = useState<Omit<Technique, "id">>(emptyTech);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const isIntermediate = user?.level === "intermediate";

  const load = () =>
    fetch("/api/technical").then((r) => r.json()).then((d) => setTechniques(Array.isArray(d) ? d : []));

  useEffect(() => { load(); }, []);

  const filtered = techniques.filter((t) => t.category === tab);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyTech, category: tab });
    setOpen(true);
    setDirty(false);
  };
  const openEdit = (t: Technique) => { setEditing(t); setForm({ ...t }); setOpen(true); setDirty(false); };

  const save = async () => {
    setSaving(true);
    const url = editing ? `/api/technical/${editing.id}` : "/api/technical";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, successRate: form.successRate ? Number(form.successRate) : null, confidence: form.confidence ? Number(form.confidence) : null }) });
    await load();
    setOpen(false);
    setSaving(false);
    setDirty(false);
  };

  const requestClose = () => {
    if (dirty) {
      const ok = window.confirm(t(
        "You have unsaved changes. Are you sure you want to leave?",
        "Tienes cambios sin guardar. ¿Seguro que quieres salir?",
        "Você tem alterações não salvas. Tem certeza de que deseja sair?",
        "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?",
        "Hai modifiche non salvate. Sei sicuro di voler uscire?"
      ));
      if (!ok) return;
    }
    setOpen(false);
    setDirty(false);
  };

  const del = async (id: string) => {
    await fetch(`/api/technical/${id}`, { method: "DELETE" });
    await load();
  };

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDirty(true);
    setForm((p) => ({ ...p, [field]: e.target.value }));
  };

  const presets = tab === "striking" ? STRIKING_TECHNIQUES : GRAPPLING_TECHNIQUES;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface">Technical</h1>
          <p className="text-sm text-stone-text mt-1">{t("Techniques and gameplan builder", "Técnicas y constructor de gameplans", "Técnicas e construtor de gameplans", "Techniques et créateur de gameplans", "Tecniche e costruttore di gameplan")}</p>
        </div>
        {tab !== "gameplans" && (isIntermediate ? (
          <Button onClick={openNew}>+ {t("Add Technique", "Añadir técnica", "Adicionar técnica", "Ajouter une technique", "Aggiungi tecnica")}</Button>
        ) : (
          <div className="text-xs text-stone-text border border-stone-border px-3 py-1.5 rounded-sm">{t("Intermediate+ unlocks full tracker", "Intermedio+ desbloquea el tracker completo", "Intermediário+ desbloqueia o tracker completo", "Intermédiaire+ débloque le tracker complet", "Intermedio+ sblocca il tracker completo")}</div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-stone-border pb-0">
        {(["striking", "grappling", "gameplans"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors -mb-px ${
              tab === tabKey
                ? "border-burgundy text-burgundy-light"
                : "border-transparent text-stone-text hover:text-beige-warm"
            }`}
          >
            {tabKey === "striking" ? t("striking", "golpeo", "golpes", "frappe", "striking") : tabKey === "grappling" ? t("grappling", "grappling", "grappling", "grappling", "grappling") : t("gameplans", "gameplans", "gameplans", "gameplans", "gameplans")}
          </button>
        ))}
      </div>

      {tab === "gameplans" ? (
        <GameplanPage />
      ) : !isIntermediate ? (
        <BeginnersView tab={tab} presets={presets} locale={locale} />
      ) : (
        <Card>
          <CardBody className="p-0 overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-stone-text text-sm">
                {tab === "striking" ? t("No striking techniques yet. Add your first one.", "Aún no hay técnicas de golpeo. Añade la primera.", "Ainda não há técnicas de golpes. Adicione a primeira.", "Aucune technique de frappe pour le moment. Ajoutez la première.", "Ancora nessuna tecnica di striking. Aggiungi la prima.") : t("No grappling techniques yet. Add your first one.", "Aún no hay técnicas de grappling. Añade la primera.", "Ainda não há técnicas de grappling. Adicione a primeira.", "Aucune technique de grappling pour le moment. Ajoutez la première.", "Ancora nessuna tecnica di grappling. Aggiungi la prima.")}
              </div>
            ) : (
              <table className="data-table min-w-[700px]">
                <thead>
                  <tr>
                    <th>{t("Technique", "Técnica", "Técnica", "Technique", "Tecnica")}</th>
                    <th>Setup</th>
                    <th>Counter</th>
                    <th>{t("Success %", "Éxito %", "Sucesso %", "Réussite %", "Successo %")}</th>
                    <th>{t("Confidence", "Confianza", "Confiança", "Confiance", "Fiducia")}</th>
                    <th>{t("Video", "Vídeo", "Vídeo", "Vidéo", "Video")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tech) => (
                    <tr key={tech.id}>
                      <td className="font-semibold text-beige-surface">{tech.name}</td>
                      <td className="text-stone-text max-w-[140px] truncate">{tech.setup ?? "—"}</td>
                      <td className="text-stone-text max-w-[140px] truncate">{tech.counter ?? "—"}</td>
                      <td>{tech.successRate != null ? `${tech.successRate}%` : "—"}</td>
                      <td>{tech.confidence != null ? <RatingDots value={tech.confidence} /> : "—"}</td>
                      <td>{tech.videoUrl ? <a href={tech.videoUrl} target="_blank" className="text-amber text-xs underline">{t("Watch", "Ver", "Ver", "Regarder", "Guarda")}</a> : "—"}</td>
                      <td>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(tech)}>{t("Edit", "Editar", "Editar", "Modifier", "Modifica")}</Button>
                          <Button variant="danger" size="sm" onClick={() => del(tech.id)}>{t("Del", "Borrar", "Excluir", "Suppr.", "Elimina")}</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      )}

      <Modal open={open} onClose={requestClose} title={editing ? t("Edit Technique", "Editar técnica", "Editar técnica", "Modifier la technique", "Modifica tecnica") : t("Add Technique", "Añadir técnica", "Adicionar técnica", "Ajouter une technique", "Aggiungi tecnica")} className="max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{t("Technique Name", "Nombre de técnica", "Nome da técnica", "Nom de la technique", "Nome della tecnica")}</label>
            <input
              list="tech-presets"
              value={form.name}
              onChange={f("name")}
              className="bg-bg-elevated border border-stone-border rounded px-3 py-2 text-sm text-beige-warm focus:outline-none focus:border-amber"
              placeholder={t("Select or type technique name", "Selecciona o escribe una técnica", "Selecione ou digite o nome da técnica", "Sélectionnez ou saisissez le nom de la technique", "Seleziona o digita il nome della tecnica")}
            />
            <datalist id="tech-presets">
              {presets.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>
          <Input label="Setup" value={form.setup ?? ""} onChange={f("setup")} placeholder={t("e.g. Jab to close range", "ej: Jab para cerrar distancia", "ex: Jab para fechar distância", "ex : Jab pour fermer la distance", "es: Jab per chiudere la distanza")} />
          <Input label="Counter" value={form.counter ?? ""} onChange={f("counter")} placeholder={t("e.g. Step off-angle", "ej: Salir en ángulo", "ex: Sair em ângulo", "ex : Sortir en angle", "es: Uscire in angolo")} />
          <Input label={t("Common Mistake", "Error común", "Erro comum", "Erreur courante", "Errore comune")} value={form.commonMistake ?? ""} onChange={f("commonMistake")} />
          <Input label={t("Success Rate %", "Porcentaje de éxito", "Taxa de sucesso %", "Taux de réussite %", "Percentuale di successo")} type="number" min={0} max={100} value={form.successRate ?? ""} onChange={f("successRate")} />
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{t(`Confidence (1–10): ${form.confidence ?? 0}`, `Confianza (1–10): ${form.confidence ?? 0}`, `Confiança (1–10): ${form.confidence ?? 0}`, `Confiance (1–10) : ${form.confidence ?? 0}`, `Fiducia (1–10): ${form.confidence ?? 0}`)}</label>
            <input type="range" min={1} max={10} value={form.confidence ?? 5} onChange={f("confidence")} />
          </div>
          <Input label={t("Video URL (optional)", "URL de vídeo (opcional)", "URL do vídeo (opcional)", "URL vidéo (facultatif)", "URL video (opzionale)")} value={form.videoUrl ?? ""} onChange={f("videoUrl")} placeholder="https://..." className="sm:col-span-2" />
          <Textarea label={t("Notes", "Notas", "Notas", "Notes", "Note")} value={form.notes ?? ""} onChange={f("notes")} rows={3} className="sm:col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={requestClose}>{t("Cancel", "Cancelar", "Cancelar", "Annuler", "Annulla")}</Button>
          <Button onClick={save} disabled={saving || !form.name}>{saving ? t("Saving…", "Guardando…", "Salvando…", "Enregistrement…", "Salvataggio…") : t("Save", "Guardar", "Salvar", "Enregistrer", "Salva")}</Button>
        </div>
      </Modal>
    </div>
  );
}

function BeginnersView({ presets, locale }: { tab: string; presets: readonly string[]; locale: Locale }) {
  const t = (en: string, es: string, pt: string, fr: string, it: string) => tr(locale, { en, es, pt, fr, it });
  return (
    <div>
      <div className="mb-4 p-3 border border-navy/30 bg-navy/10 rounded-sm text-xs text-navy-light">
        <span className="font-bold uppercase">{t("Beginner Mode", "Modo principiante", "Modo iniciante", "Mode débutant", "Modalità principiante")}</span> — {t("Focus on fundamentals. Upgrade to Intermediate to unlock full technique tracking.", "Céntrate en fundamentos. Sube a intermedio para desbloquear el tracker completo.", "Concentre-se nos fundamentos. Suba para intermediário para desbloquear o tracker completo.", "Concentrez-vous sur les fondamentaux. Passez au niveau intermédiaire pour débloquer le suivi complet.", "Concentrati sui fondamentali. Passa a intermedio per sbloccare il tracker completo.")}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {presets.slice(0, 12).map((name) => (
          <div key={name} className="bg-bg-card border border-stone-border rounded-sm px-4 py-3">
            <div className="text-sm font-semibold text-beige-warm">{name}</div>
            <div className="text-xs text-stone-text mt-1">{t("Study this technique", "Estudia esta técnica", "Estude esta técnica", "Étudiez cette technique", "Studia questa tecnica")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
