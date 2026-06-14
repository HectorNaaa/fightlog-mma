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
  const isEs = locale === "es";
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [tab, setTab] = useState<"striking" | "grappling">("striking");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Technique | null>(null);
  const [form, setForm] = useState<Omit<Technique, "id">>(emptyTech);
  const [saving, setSaving] = useState(false);

  const isIntermediate = user?.level === "intermediate";

  const load = () =>
    fetch("/api/technical").then((r) => r.json()).then((d) => setTechniques(Array.isArray(d) ? d : []));

  useEffect(() => { load(); }, []);

  const filtered = techniques.filter((t) => t.category === tab);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyTech, category: tab });
    setOpen(true);
  };
  const openEdit = (t: Technique) => { setEditing(t); setForm({ ...t }); setOpen(true); };

  const save = async () => {
    setSaving(true);
    const url = editing ? `/api/technical/${editing.id}` : "/api/technical";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, successRate: form.successRate ? Number(form.successRate) : null, confidence: form.confidence ? Number(form.confidence) : null }) });
    await load();
    setOpen(false);
    setSaving(false);
  };

  const del = async (id: string) => {
    await fetch(`/api/technical/${id}`, { method: "DELETE" });
    await load();
  };

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const presets = tab === "striking" ? STRIKING_TECHNIQUES : GRAPPLING_TECHNIQUES;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface">Technical Tracker</h1>
          <p className="text-sm text-stone-text mt-1">{isEs ? "Valora y analiza tus técnicas" : "Rate and analyze your techniques"}</p>
        </div>
        {isIntermediate ? (
          <Button onClick={openNew}>+ {isEs ? "Añadir técnica" : "Add Technique"}</Button>
        ) : (
          <div className="text-xs text-stone-text border border-stone-border px-3 py-1.5 rounded-sm">{isEs ? "Intermedio+ desbloquea el tracker completo" : "Intermediate+ unlocks full tracker"}</div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-stone-border pb-0">
        {(["striking", "grappling"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors -mb-px ${
              tab === t
                ? "border-burgundy text-burgundy-light"
                : "border-transparent text-stone-text hover:text-beige-warm"
            }`}
          >
            {isEs ? (t === "striking" ? "golpeo" : "grappling") : t}
          </button>
        ))}
      </div>

      {!isIntermediate ? (
        <BeginnersView tab={tab} presets={presets} isEs={isEs} />
      ) : (
        <Card>
          <CardBody className="p-0 overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-stone-text text-sm">
                {isEs ? `Aún no hay técnicas de ${tab === "striking" ? "golpeo" : "grappling"}. Añade la primera.` : `No ${tab} techniques yet. Add your first one.`}
              </div>
            ) : (
              <table className="data-table min-w-[700px]">
                <thead>
                  <tr>
                    <th>{isEs ? "Técnica" : "Technique"}</th>
                    <th>{isEs ? "Setup" : "Setup"}</th>
                    <th>{isEs ? "Counter" : "Counter"}</th>
                    <th>{isEs ? "Éxito %" : "Success %"}</th>
                    <th>{isEs ? "Confianza" : "Confidence"}</th>
                    <th>{isEs ? "Vídeo" : "Video"}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id}>
                      <td className="font-semibold text-beige-surface">{t.name}</td>
                      <td className="text-stone-text max-w-[140px] truncate">{t.setup ?? "—"}</td>
                      <td className="text-stone-text max-w-[140px] truncate">{t.counter ?? "—"}</td>
                      <td>{t.successRate != null ? `${t.successRate}%` : "—"}</td>
                      <td>{t.confidence != null ? <RatingDots value={t.confidence} /> : "—"}</td>
                      <td>{t.videoUrl ? <a href={t.videoUrl} target="_blank" className="text-amber text-xs underline">{isEs ? "Ver" : "Watch"}</a> : "—"}</td>
                      <td>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>{isEs ? "Editar" : "Edit"}</Button>
                          <Button variant="danger" size="sm" onClick={() => del(t.id)}>{isEs ? "Borrar" : "Del"}</Button>
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

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? (isEs ? "Editar técnica" : "Edit Technique") : (isEs ? "Añadir técnica" : "Add Technique")} className="max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{isEs ? "Nombre de técnica" : "Technique Name"}</label>
            <input
              list="tech-presets"
              value={form.name}
              onChange={f("name")}
              className="bg-bg-elevated border border-stone-border rounded px-3 py-2 text-sm text-beige-warm focus:outline-none focus:border-amber"
              placeholder={isEs ? "Selecciona o escribe una técnica" : "Select or type technique name"}
            />
            <datalist id="tech-presets">
              {presets.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>
          <Input label="Setup" value={form.setup ?? ""} onChange={f("setup")} placeholder={isEs ? "ej: Jab para cerrar distancia" : "e.g. Jab to close range"} />
          <Input label="Counter" value={form.counter ?? ""} onChange={f("counter")} placeholder={isEs ? "ej: Salir en ángulo" : "e.g. Step off-angle"} />
          <Input label={isEs ? "Error común" : "Common Mistake"} value={form.commonMistake ?? ""} onChange={f("commonMistake")} />
          <Input label={isEs ? "Porcentaje de éxito" : "Success Rate %"} type="number" min={0} max={100} value={form.successRate ?? ""} onChange={f("successRate")} />
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{isEs ? `Confianza (1–10): ${form.confidence ?? 0}` : `Confidence (1–10): ${form.confidence ?? 0}`}</label>
            <input type="range" min={1} max={10} value={form.confidence ?? 5} onChange={f("confidence")} />
          </div>
          <Input label={isEs ? "URL de vídeo (opcional)" : "Video URL (optional)"} value={form.videoUrl ?? ""} onChange={f("videoUrl")} placeholder="https://..." className="sm:col-span-2" />
          <Textarea label={isEs ? "Notas" : "Notes"} value={form.notes ?? ""} onChange={f("notes")} rows={3} className="sm:col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setOpen(false)}>{isEs ? "Cancelar" : "Cancel"}</Button>
          <Button onClick={save} disabled={saving || !form.name}>{saving ? (isEs ? "Guardando…" : "Saving…") : (isEs ? "Guardar" : "Save")}</Button>
        </div>
      </Modal>
    </div>
  );
}

function BeginnersView({ presets, isEs }: { tab: string; presets: readonly string[]; isEs: boolean }) {
  return (
    <div>
      <div className="mb-4 p-3 border border-navy/30 bg-navy/10 rounded-sm text-xs text-navy-light">
        <span className="font-bold uppercase">{isEs ? "Modo principiante" : "Beginner Mode"}</span> — {isEs ? "Céntrate en fundamentos. Sube a intermedio para desbloquear el tracker completo." : "Focus on fundamentals. Upgrade to Intermediate to unlock full technique tracking."}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {presets.slice(0, 12).map((name) => (
          <div key={name} className="bg-bg-card border border-stone-border rounded-sm px-4 py-3">
            <div className="text-sm font-semibold text-beige-warm">{name}</div>
            <div className="text-xs text-stone-text mt-1">{isEs ? "Estudia esta técnica" : "Study this technique"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
