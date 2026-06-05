"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardBody } from "@/components/ui/card";
import { RatingDots } from "@/components/ui/badge";
import { formatDate, formatDateInput } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

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
        <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface mb-6">Sparring Review</h1>
        <div className="border border-navy/30 bg-navy/10 rounded-sm p-6 text-center max-w-lg mx-auto mt-10">
          <div className="text-4xl mb-3 opacity-30">⬡</div>
          <div className="font-condensed text-xl font-bold uppercase tracking-widest text-navy-light mb-2">Intermediate Feature</div>
          <p className="text-sm text-stone-text">Sparring analysis is available for Intermediate Amateur fighters.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface">Sparring Review</h1>
          <p className="text-sm text-stone-text mt-1">{sessions.length} sessions logged</p>
        </div>
        <Button onClick={openNew}>+ Log Sparring</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sessions.length === 0 && (
          <div className="col-span-full p-10 text-center text-stone-text text-sm border border-stone-border/50 rounded-sm">
            No sparring sessions yet.
          </div>
        )}
        {sessions.map((s) => (
          <Card key={s.id}>
            <CardBody>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-stone-text">{formatDate(s.date)}</div>
                  <div className="font-semibold text-beige-surface">{s.partnerStyle || "Unknown style"}</div>
                  <div className="text-xs text-stone-text mt-0.5">{s.rounds ?? "?"} rounds × {s.roundLength ?? "?"} min</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => del(s.id)}>×</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                {s.cardioRating != null && <Rating label="Cardio" value={s.cardioRating} />}
                {s.composureRating != null && <Rating label="Composure" value={s.composureRating} />}
                {s.defenseRating != null && <Rating label="Defense" value={s.defenseRating} />}
                {s.overallRating != null && <Rating label="Overall" value={s.overallRating} />}
              </div>
              {s.bestTechniques && (
                <div className="text-xs mb-1">
                  <span className="text-stone-text">Best: </span>
                  <span className="text-amber">{s.bestTechniques}</span>
                </div>
              )}
              {s.mistakes && (
                <div className="text-xs mb-1">
                  <span className="text-stone-text">Mistakes: </span>
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

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Sparring" : "Log Sparring Session"} className="max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date" type="date" value={form.date} onChange={f("date")} />
          <Input label="Partner Style" value={form.partnerStyle ?? ""} onChange={f("partnerStyle")} placeholder="e.g. Boxer, Wrestler" />
          <Input label="Rounds" type="number" min={1} value={form.rounds ?? ""} onChange={f("rounds")} />
          <Input label="Round Length (min)" type="number" min={1} value={form.roundLength ?? ""} onChange={f("roundLength")} />
          {(["cardioRating", "composureRating", "defenseRating", "overallRating"] as const).map((field) => (
            <div key={field} className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{field.replace("Rating", "").replace(/([A-Z])/g, " $1")} (1–10): {form[field] ?? 0}</label>
              <input type="range" min={1} max={10} value={form[field] ?? 5} onChange={f(field)} />
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Damage Taken (1–10): {form.damageTaken ?? 0}</label>
            <input type="range" min={0} max={10} value={form.damageTaken ?? 0} onChange={f("damageTaken")} />
          </div>
          <Textarea label="Dominant Moments" value={form.dominantMoments ?? ""} onChange={f("dominantMoments")} rows={2} />
          <Textarea label="Mistakes" value={form.mistakes ?? ""} onChange={f("mistakes")} rows={2} />
          <Textarea label="Best Techniques Landed" value={form.bestTechniques ?? ""} onChange={f("bestTechniques")} rows={2} />
          <Textarea label="Techniques That Failed" value={form.techniquesFailed ?? ""} onChange={f("techniquesFailed")} rows={2} />
          <Textarea label="Lessons for Next Session" value={form.lessons ?? ""} onChange={f("lessons")} rows={3} className="col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
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
