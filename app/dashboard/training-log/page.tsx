"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge, RatingDots } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { TRAINING_TYPES, formatDate, formatDateInput } from "@/lib/utils";

interface Session {
  id: string;
  date: string;
  type: string;
  duration: number;
  intensity: number;
  energyBefore: number;
  energyAfter: number;
  soreness: number;
  bodyWeight?: number | null;
  mood?: string | null;
  mainFocus?: string | null;
  notes?: string | null;
  coachFeedback?: string | null;
  personalRating?: number | null;
}

const empty: Omit<Session, "id"> = {
  date: formatDateInput(new Date()),
  type: "MMA",
  duration: 60,
  intensity: 7,
  energyBefore: 7,
  energyAfter: 6,
  soreness: 5,
  bodyWeight: null,
  mood: "",
  mainFocus: "",
  notes: "",
  coachFeedback: "",
  personalRating: null,
};

export default function TrainingLogPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [form, setForm] = useState<Omit<Session, "id">>(empty);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () =>
    fetch("/api/training").then((r) => r.json()).then((d) => setSessions(Array.isArray(d) ? d : []));

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Session) => {
    setEditing(s);
    setForm({ ...s, date: formatDateInput(s.date) });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const url = editing ? `/api/training/${editing.id}` : "/api/training";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, duration: Number(form.duration), intensity: Number(form.intensity), energyBefore: Number(form.energyBefore), energyAfter: Number(form.energyAfter), soreness: Number(form.soreness), bodyWeight: form.bodyWeight ? Number(form.bodyWeight) : null, personalRating: form.personalRating ? Number(form.personalRating) : null }) });
    await load();
    setOpen(false);
    setSaving(false);
  };

  const del = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/training/${id}`, { method: "DELETE" });
    await load();
    setDeleting(null);
  };

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface">Training Log</h1>
          <p className="text-sm text-stone-text mt-1">{sessions.length} sessions recorded</p>
        </div>
        <Button onClick={openNew}>+ New Session</Button>
      </div>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {sessions.length === 0 ? (
            <div className="p-10 text-center text-stone-text text-sm">No sessions yet. Log your first training session.</div>
          ) : (
            <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Intensity</th>
                  <th>Energy ↑↓</th>
                  <th>Soreness</th>
                  <th>Weight</th>
                  <th>Focus</th>
                  <th>Rating</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="text-stone-text whitespace-nowrap">{formatDate(s.date)}</td>
                    <td><Badge label={s.type} /></td>
                    <td>{s.duration}m</td>
                    <td><RatingDots value={s.intensity} /></td>
                    <td className="text-xs">{s.energyBefore} → {s.energyAfter}</td>
                    <td>{s.soreness}/10</td>
                    <td className="text-stone-text">{s.bodyWeight ? `${s.bodyWeight}kg` : "—"}</td>
                    <td className="max-w-[150px] truncate text-stone-text">{s.mainFocus ?? "—"}</td>
                    <td>{s.personalRating ? <RatingDots value={s.personalRating} /> : "—"}</td>
                    <td>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => del(s.id)} disabled={deleting === s.id}>Del</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Session" : "Log New Session"} className="max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Date" type="date" value={form.date} onChange={f("date")} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Type</label>
            <Select value={form.type} onChange={f("type")}>
              {TRAINING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <Input label="Duration (min)" type="number" min={1} value={form.duration} onChange={f("duration")} />
          <Input label="Body Weight (kg)" type="number" step="0.1" value={form.bodyWeight ?? ""} onChange={f("bodyWeight")} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Intensity (1–10): {form.intensity}</label>
            <input type="range" min={1} max={10} value={form.intensity} onChange={f("intensity")} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Energy Before (1–10): {form.energyBefore}</label>
            <input type="range" min={1} max={10} value={form.energyBefore} onChange={f("energyBefore")} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Energy After (1–10): {form.energyAfter}</label>
            <input type="range" min={1} max={10} value={form.energyAfter} onChange={f("energyAfter")} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Soreness (1–10): {form.soreness}</label>
            <input type="range" min={1} max={10} value={form.soreness} onChange={f("soreness")} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Personal Rating (1–10): {form.personalRating ?? 0}</label>
            <input type="range" min={0} max={10} value={form.personalRating ?? 0} onChange={f("personalRating")} />
          </div>
          <Input label="Mood" value={form.mood ?? ""} onChange={f("mood")} placeholder="e.g. Sharp, Tired, Focused" />
          <Input label="Main Focus" value={form.mainFocus ?? ""} onChange={f("mainFocus")} placeholder="e.g. Takedown defense" className="sm:col-span-2" />
          <Textarea label="Notes" value={form.notes ?? ""} onChange={f("notes")} rows={3} className="sm:col-span-2" />
          <Textarea label="Coach Feedback" value={form.coachFeedback ?? ""} onChange={f("coachFeedback")} rows={2} className="sm:col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : editing ? "Update" : "Save Session"}</Button>
        </div>
      </Modal>
    </div>
  );
}
