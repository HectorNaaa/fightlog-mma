"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { MetricChart } from "@/components/charts/metric-chart";
import { formatDate, formatDateInput } from "@/lib/utils";

interface Metric {
  id: string;
  date: string;
  bodyWeight?: number | null;
  restingHeartRate?: number | null;
  sleepHours?: number | null;
  sleepQuality?: number | null;
  calories?: number | null;
  strengthNotes?: string | null;
  cardioNotes?: string | null;
  injuries?: string | null;
  recoveryScore?: number | null;
}

const empty: Omit<Metric, "id"> = {
  date: formatDateInput(new Date()),
  bodyWeight: null,
  restingHeartRate: null,
  sleepHours: null,
  sleepQuality: null,
  calories: null,
  strengthNotes: "",
  cardioNotes: "",
  injuries: "",
  recoveryScore: null,
};

export default function PhysicalMetricsPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Metric | null>(null);
  const [form, setForm] = useState<Omit<Metric, "id">>(empty);
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetch("/api/metrics").then((r) => r.json()).then((d) => setMetrics(Array.isArray(d) ? d : []));

  useEffect(() => { load(); }, []);

  const chronological = [...metrics].reverse();

  const weightChart = chronological.filter((m) => m.bodyWeight != null).map((m) => ({ label: formatDate(m.date).slice(0, 6), value: m.bodyWeight! }));
  const recoveryChart = chronological.filter((m) => m.recoveryScore != null).map((m) => ({ label: formatDate(m.date).slice(0, 6), value: m.recoveryScore! }));
  const hrChart = chronological.filter((m) => m.restingHeartRate != null).map((m) => ({ label: formatDate(m.date).slice(0, 6), value: m.restingHeartRate! }));
  const sleepChart = chronological.filter((m) => m.sleepHours != null).map((m) => ({ label: formatDate(m.date).slice(0, 6), value: m.sleepHours! }));

  const save = async () => {
    setSaving(true);
    const url = editing ? `/api/metrics/${editing.id}` : "/api/metrics";
    const method = editing ? "PUT" : "POST";
    const payload = {
      ...form,
      bodyWeight: form.bodyWeight ? Number(form.bodyWeight) : null,
      restingHeartRate: form.restingHeartRate ? Number(form.restingHeartRate) : null,
      sleepHours: form.sleepHours ? Number(form.sleepHours) : null,
      sleepQuality: form.sleepQuality ? Number(form.sleepQuality) : null,
      calories: form.calories ? Number(form.calories) : null,
      recoveryScore: form.recoveryScore ? Number(form.recoveryScore) : null,
    };
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await load();
    setOpen(false);
    setSaving(false);
  };

  const del = async (id: string) => {
    await fetch(`/api/metrics/${id}`, { method: "DELETE" });
    await load();
  };

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const openEdit = (m: Metric) => { setEditing(m); setForm({ ...m, date: formatDateInput(m.date) }); setOpen(true); };
  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface">Physical Metrics</h1>
          <p className="text-sm text-stone-text mt-1">Body weight, recovery and health tracking</p>
        </div>
        <Button onClick={openNew}>+ Log Metrics</Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader><div className="text-xs font-bold uppercase tracking-widest text-stone-text">Body Weight</div></CardHeader>
          <CardBody>{weightChart.length > 0 ? <MetricChart data={weightChart} color="#c4a882" height={150} /> : <Empty text="No weight data yet" />}</CardBody>
        </Card>
        <Card>
          <CardHeader><div className="text-xs font-bold uppercase tracking-widest text-stone-text">Recovery Score</div></CardHeader>
          <CardBody>{recoveryChart.length > 0 ? <MetricChart data={recoveryChart} color="#8b2635" height={150} /> : <Empty text="No recovery data yet" />}</CardBody>
        </Card>
        <Card>
          <CardHeader><div className="text-xs font-bold uppercase tracking-widest text-stone-text">Resting Heart Rate</div></CardHeader>
          <CardBody>{hrChart.length > 0 ? <MetricChart data={hrChart} color="#2d3a5e" type="line" height={150} /> : <Empty text="No HR data yet" />}</CardBody>
        </Card>
        <Card>
          <CardHeader><div className="text-xs font-bold uppercase tracking-widest text-stone-text">Sleep Hours</div></CardHeader>
          <CardBody>{sleepChart.length > 0 ? <MetricChart data={sleepChart} color="#d4a017" type="line" height={150} /> : <Empty text="No sleep data yet" />}</CardBody>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {metrics.length === 0 ? (
            <div className="p-10 text-center text-stone-text text-sm">No metric entries yet.</div>
          ) : (
            <table className="data-table min-w-[800px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>Resting HR</th>
                  <th>Sleep</th>
                  <th>Sleep Q.</th>
                  <th>Calories</th>
                  <th>Recovery</th>
                  <th>Injuries</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.id}>
                    <td className="text-stone-text whitespace-nowrap">{formatDate(m.date)}</td>
                    <td>{m.bodyWeight ? `${m.bodyWeight}kg` : "—"}</td>
                    <td>{m.restingHeartRate ? `${m.restingHeartRate}bpm` : "—"}</td>
                    <td>{m.sleepHours ? `${m.sleepHours}h` : "—"}</td>
                    <td>{m.sleepQuality ? `${m.sleepQuality}/10` : "—"}</td>
                    <td>{m.calories ?? "—"}</td>
                    <td>{m.recoveryScore ? `${m.recoveryScore}/10` : "—"}</td>
                    <td className="text-stone-text max-w-[150px] truncate">{m.injuries ?? "—"}</td>
                    <td>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => del(m.id)}>Del</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Metrics" : "Log Physical Metrics"} className="max-w-xl">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date" type="date" value={form.date} onChange={f("date")} className="col-span-2" />
          <Input label="Body Weight (kg)" type="number" step="0.1" value={form.bodyWeight ?? ""} onChange={f("bodyWeight")} />
          <Input label="Resting Heart Rate" type="number" value={form.restingHeartRate ?? ""} onChange={f("restingHeartRate")} />
          <Input label="Sleep Hours" type="number" step="0.5" value={form.sleepHours ?? ""} onChange={f("sleepHours")} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Sleep Quality (1–10): {form.sleepQuality ?? 0}</label>
            <input type="range" min={1} max={10} value={form.sleepQuality ?? 5} onChange={f("sleepQuality")} />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">Recovery Score (1–10): {form.recoveryScore ?? 0}</label>
            <input type="range" min={1} max={10} value={form.recoveryScore ?? 5} onChange={f("recoveryScore")} />
          </div>
          <Input label="Calories (optional)" type="number" value={form.calories ?? ""} onChange={f("calories")} className="col-span-2" />
          <Textarea label="Strength Notes" value={form.strengthNotes ?? ""} onChange={f("strengthNotes")} rows={2} />
          <Textarea label="Cardio Notes" value={form.cardioNotes ?? ""} onChange={f("cardioNotes")} rows={2} />
          <Textarea label="Injuries / Pain Areas" value={form.injuries ?? ""} onChange={f("injuries")} rows={2} className="col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </Modal>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="py-6 text-center text-xs text-stone-text">{text}</div>;
}
