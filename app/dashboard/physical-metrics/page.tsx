"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { MetricChart } from "@/components/charts/metric-chart";
import { formatDate, formatDateInput } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/i18n";
import SparringPage from "@/app/dashboard/sparring/page";
import WeeklyReviewPage from "@/app/dashboard/weekly-review/page";

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
  const { locale } = useLanguage();
  const t = (en: string, es: string, pt: string, fr: string, it: string) => tr(locale, { en, es, pt, fr, it });
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [tab, setTab] = useState<"metrics" | "sparring" | "weekly">("metrics");
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
          <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface">{t("Performance", "Rendimiento", "Desempenho", "Performance", "Prestazioni")}</h1>
          <p className="text-sm text-stone-text mt-1">{t("Metrics, sparring and weekly review", "Métricas, sparring y revisión semanal", "Métricas, sparring e revisão semanal", "Métriques, sparring et revue hebdomadaire", "Metriche, sparring e revisione settimanale")}</p>
        </div>
        {tab === "metrics" && <Button onClick={openNew}>+ {t("Log Metrics", "Registrar métricas", "Registrar métricas", "Enregistrer métriques", "Registra metriche")}</Button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-stone-border pb-0">
        {([
          { key: "metrics", label: t("Metrics", "Métricas", "Métricas", "Métriques", "Metriche") },
          { key: "sparring", label: "Sparring" },
          { key: "weekly", label: t("Weekly Review", "Revisión semanal", "Revisão semanal", "Revue hebdomadaire", "Revisione settimanale") },
        ] as const).map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors -mb-px ${
              tab === item.key
                ? "border-burgundy text-burgundy-light"
                : "border-transparent text-stone-text hover:text-beige-warm"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "sparring" ? (
        <SparringPage />
      ) : tab === "weekly" ? (
        <WeeklyReviewPage />
      ) : (
      <>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader><div className="text-xs font-bold uppercase tracking-widest text-stone-text">{t("Body Weight", "Peso corporal", "Peso corporal", "Poids corporel", "Peso corporeo")}</div></CardHeader>
          <CardBody>{weightChart.length > 0 ? <MetricChart data={weightChart} color="#c4a882" height={150} /> : <Empty text={t("No weight data yet", "Sin datos de peso aún", "Ainda sem dados de peso", "Pas encore de données de poids", "Ancora nessun dato sul peso")} />}</CardBody>
        </Card>
        <Card>
          <CardHeader><div className="text-xs font-bold uppercase tracking-widest text-stone-text">{t("Recovery Score", "Recuperación", "Recuperação", "Récupération", "Recupero")}</div></CardHeader>
          <CardBody>{recoveryChart.length > 0 ? <MetricChart data={recoveryChart} color="#8b2635" height={150} /> : <Empty text={t("No recovery data yet", "Sin datos de recuperación", "Ainda sem dados de recuperação", "Pas encore de données de récupération", "Ancora nessun dato di recupero")} />}</CardBody>
        </Card>
        <Card>
          <CardHeader><div className="text-xs font-bold uppercase tracking-widest text-stone-text">{t("Resting Heart Rate", "Frecuencia en reposo", "Frequência em repouso", "Fréquence cardiaque au repos", "Frequenza a riposo")}</div></CardHeader>
          <CardBody>{hrChart.length > 0 ? <MetricChart data={hrChart} color="#2a2622" type="line" height={150} /> : <Empty text={t("No HR data yet", "Sin datos de FC", "Ainda sem dados de FC", "Pas encore de données FC", "Ancora nessun dato FC")} />}</CardBody>
        </Card>
        <Card>
          <CardHeader><div className="text-xs font-bold uppercase tracking-widest text-stone-text">{t("Sleep Hours", "Horas de sueño", "Horas de sono", "Heures de sommeil", "Ore di sonno")}</div></CardHeader>
          <CardBody>{sleepChart.length > 0 ? <MetricChart data={sleepChart} color="#c9a875" type="line" height={150} /> : <Empty text={t("No sleep data yet", "Sin datos de sueño", "Ainda sem dados de sono", "Pas encore de données de sommeil", "Ancora nessun dato sul sonno")} />}</CardBody>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {metrics.length === 0 ? (
            <div className="p-10 text-center text-stone-text text-sm">{t("No metric entries yet.", "Aún no hay registros de métricas.", "Ainda não há registros de métricas.", "Aucune entrée de métrique pour le moment.", "Ancora nessuna voce di metrica.")}</div>
          ) : (
            <table className="data-table min-w-[800px]">
              <thead>
                <tr>
                  <th>{t("Date", "Fecha", "Data", "Date", "Data")}</th>
                  <th>{t("Weight", "Peso", "Peso", "Poids", "Peso")}</th>
                  <th>{t("Resting HR", "FC reposo", "FC repouso", "FC repos", "FC riposo")}</th>
                  <th>{t("Sleep", "Sueño", "Sono", "Sommeil", "Sonno")}</th>
                  <th>{t("Sleep Q.", "Cal. sueño", "Qual. sono", "Qual. sommeil", "Qual. sonno")}</th>
                  <th>{t("Calories", "Calorías", "Calorias", "Calories", "Calorie")}</th>
                  <th>{t("Recovery", "Recuperación", "Recuperação", "Récupération", "Recupero")}</th>
                  <th>{t("Injuries", "Lesiones", "Lesões", "Blessures", "Infortuni")}</th>
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
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>{t("Edit", "Editar", "Editar", "Modifier", "Modifica")}</Button>
                        <Button variant="danger" size="sm" onClick={() => del(m.id)}>{t("Del", "Borrar", "Excluir", "Suppr", "Elimina")}</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t("Edit Metrics", "Editar métricas", "Editar métricas", "Modifier métriques", "Modifica metriche") : t("Log Physical Metrics", "Registrar métricas", "Registrar métricas", "Enregistrer métriques", "Registra metriche")} className="max-w-xl">
        <div className="grid grid-cols-2 gap-4">
          <Input label={t("Date", "Fecha", "Data", "Date", "Data")} type="date" value={form.date} onChange={f("date")} className="col-span-2" />
          <Input label={t("Body Weight (kg)", "Peso corporal (kg)", "Peso corporal (kg)", "Poids corporel (kg)", "Peso corporeo (kg)")} type="number" step="0.1" value={form.bodyWeight ?? ""} onChange={f("bodyWeight")} />
          <Input label={t("Resting Heart Rate", "Frecuencia cardiaca en reposo", "Frequência cardíaca em repouso", "Fréquence cardiaque au repos", "Frequenza cardiaca a riposo")} type="number" value={form.restingHeartRate ?? ""} onChange={f("restingHeartRate")} />
          <Input label={t("Sleep Hours", "Horas de sueño", "Horas de sono", "Heures de sommeil", "Ore di sonno")} type="number" step="0.5" value={form.sleepHours ?? ""} onChange={f("sleepHours")} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{t("Sleep Quality", "Calidad del sueño", "Qualidade do sono", "Qualité du sommeil", "Qualità del sonno")} (1–10): {form.sleepQuality ?? 0}</label>
            <input title={t("Sleep Quality", "Calidad del sueño", "Qualidade do sono", "Qualité du sommeil", "Qualità del sonno")} type="range" min={1} max={10} value={form.sleepQuality ?? 5} onChange={f("sleepQuality")} />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{t("Recovery Score", "Puntuación de recuperación", "Pontuação de recuperação", "Score de récupération", "Punteggio di recupero")} (1–10): {form.recoveryScore ?? 0}</label>
            <input title={t("Recovery Score", "Puntuación de recuperación", "Pontuação de recuperação", "Score de récupération", "Punteggio di recupero")} type="range" min={1} max={10} value={form.recoveryScore ?? 5} onChange={f("recoveryScore")} />
          </div>
          <Input label={t("Calories (optional)", "Calorías (opcional)", "Calorias (opcional)", "Calories (facultatif)", "Calorie (opzionale)")} type="number" value={form.calories ?? ""} onChange={f("calories")} className="col-span-2" />
          <Textarea label={t("Strength Notes", "Notas de fuerza", "Notas de força", "Notes de force", "Note sulla forza")} value={form.strengthNotes ?? ""} onChange={f("strengthNotes")} rows={2} />
          <Textarea label={t("Cardio Notes", "Notas de cardio", "Notas de cardio", "Notes de cardio", "Note sul cardio")} value={form.cardioNotes ?? ""} onChange={f("cardioNotes")} rows={2} />
          <Textarea label={t("Injuries / Pain Areas", "Lesiones / zonas de dolor", "Lesões / áreas de dor", "Blessures / zones douloureuses", "Infortuni / aree dolorose")} value={form.injuries ?? ""} onChange={f("injuries")} rows={2} className="col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setOpen(false)}>{t("Cancel", "Cancelar", "Cancelar", "Annuler", "Annulla")}</Button>
          <Button onClick={save} disabled={saving}>{saving ? t("Saving…", "Guardando…", "Salvando…", "Enregistrement…", "Salvataggio…") : t("Save", "Guardar", "Salvar", "Enregistrer", "Salva")}</Button>
        </div>
      </Modal>
      </>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="py-6 text-center text-xs text-stone-text">{text}</div>;
}
