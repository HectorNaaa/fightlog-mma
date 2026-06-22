"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { MetricChart } from "@/components/charts/metric-chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatDate, formatDateInput, TRAINING_TYPES } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

const MOTIVATIONS: Record<number, string> = {
  0: "Hoy empieza tu racha. Un entreno cambia el día.",
  1: "1 día. La consistencia se construye así, uno a uno.",
  2: "2 días seguidos. El cuerpo recuerda.",
  3: "3 días. Estás creando un hábito real.",
  5: "5 días. Eso es disciplina, no motivación.",
  7: "Una semana entera. Pocos llegan aquí.",
  14: "Dos semanas. El trabajo habla por ti.",
  30: "Un mes. Ya eres otro luchador.",
};
const MOTIVATIONS_EN: Record<number, string> = {
  0: "Your streak starts today. One session can change the day.",
  1: "1 day. Consistency is built one day at a time.",
  2: "2 days in a row. Your body remembers.",
  3: "3 days. You are building a real habit.",
  5: "5 days. That's discipline, not motivation.",
  7: "A full week. Few make it this far.",
  14: "Two weeks. Your work speaks for itself.",
  30: "One month. You are not the same athlete anymore.",
};
function getMotivation(streak: number, locale: string): string {
  const table = locale === "es" ? MOTIVATIONS : MOTIVATIONS_EN;
  const keys = Object.keys(table).map(Number).sort((a, b) => b - a);
  for (const k of keys) { if (streak >= k) return table[k]; }
  return locale === "es" ? "Hoy empieza tu racha." : "Your streak starts today.";
}

interface Session { id: string; date: string; type: string; duration: number; intensity: number; energyBefore: number; energyAfter: number; soreness: number; mainFocus?: string | null; personalRating?: number | null; }
interface Tip { sessionId: string; authorName: string; gymName?: string | null; date: string; type: string; tacticNote: string | null; respetos: number; hasRespeto: boolean; }

const emptyForm = { date: "", type: "Boxing", duration: 60, intensity: 7, energyBefore: 7, energyAfter: 6, soreness: 5, bodyWeight: null as number | null, mood: "", mainFocus: "", physicalState: 3, dailyFocus: "", tacticNote: "", tacticPublic: false };

export default function DashboardPage() {
  const { user, refetch } = useAuth();
  const { locale, t } = useLanguage();

  function localeToIntl(l: string) {
    switch (l) {
      case "es":
        return "es-ES";
      case "pt":
        return "pt-BR";
      case "fr":
        return "fr-FR";
      case "it":
        return "it-IT";
      default:
        return "en-US";
    }
  }
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [fabOpen, setFabOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, date: formatDateInput(new Date()) });
  const [saving, setSaving] = useState(false);
  const [focusEdit, setFocusEdit] = useState(false);
  const [focusVal, setFocusVal] = useState("");
  const focusRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [s, t] = await Promise.all([
      fetch("/api/training").then(r => r.json()).catch(() => []),
      fetch("/api/community/tips").then(r => r.json()).catch(() => []),
    ]);
    setSessions(Array.isArray(s) ? s : []);
    setTips(Array.isArray(t) ? t : []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setFocusVal(user?.todayFocus ?? ""); }, [user]);
  useEffect(() => { if (focusEdit) focusRef.current?.focus(); }, [focusEdit]);

  const streak = user?.streak ?? 0;
  const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklySessions = sessions.filter(s => new Date(s.date) >= oneWeekAgo);
  const weeklyMinutes = weeklySessions.reduce((a, s) => a + s.duration, 0);
  const last = sessions[0];

  const saveFocus = async () => {
    await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ todayFocus: focusVal }) });
    await refetch();
    setFocusEdit(false);
  };

  const saveSession = async () => {
    setSaving(true);
    await fetch("/api/training", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, duration: Number(form.duration), intensity: Number(form.intensity), energyBefore: Number(form.energyBefore), energyAfter: Number(form.energyAfter), soreness: Number(form.soreness), physicalState: Number(form.physicalState), tacticPublic: form.tacticPublic }) });
    await load();
    await refetch();
    setFabOpen(false);
    setSaving(false);
    setForm({ ...emptyForm, date: formatDateInput(new Date()) });
  };

  const toggleRespeto = async (sessionId: string) => {
    await fetch(`/api/tips/${sessionId}/respeto`, { method: "POST" });
    setTips(prev => prev.map(t => t.sessionId === sessionId ? { ...t, respetos: t.hasRespeto ? t.respetos - 1 : t.respetos + 1, hasRespeto: !t.hasRespeto } : t));
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(p => ({ ...p, [field]: e.target.value }));

  const chartData = [...sessions].reverse().slice(-8).map(s => ({ label: formatDate(s.date).slice(0, 6), value: s.duration }));

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-stone-text uppercase tracking-widest">{new Date().toLocaleDateString(localeToIntl(locale), { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="font-condensed font-black text-2xl uppercase tracking-wider text-beige-surface mt-0.5">
            {t.common.hello}, {user?.name?.split(" ")[0]}
          </h1>
        </div>
        <Link href="/api/export" className="text-[10px] text-stone-text/60 hover:text-stone-text uppercase tracking-widest border border-stone-border/50 px-2 py-1 rounded-sm transition-colors">{t.dashboard.export}</Link>
      </div>

      {/* Streak Card */}
      <div className={cn("rounded-sm p-4 border", streak >= 7 ? "bg-amber/10 border-amber/30" : streak >= 3 ? "bg-burgundy/10 border-burgundy/20" : "bg-bg-card border-stone-border")}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-widest text-stone-text">{t.dashboard.consistencyStreak}</span>
          <span className={cn("font-condensed font-black text-3xl", streak >= 7 ? "text-amber" : streak >= 3 ? "text-burgundy-light" : "text-beige-surface")}>
            {streak} <span className="text-sm font-normal text-stone-text">{t.dashboard.days}</span>
          </span>
        </div>
        <p className="text-xs text-stone-text/80 italic">{getMotivation(streak, locale)}</p>
        <div className="flex gap-1 mt-3">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const trained = sessions.some(s => { const sd = new Date(s.date); return `${sd.getFullYear()}-${sd.getMonth()}-${sd.getDate()}` === key; });
            return <div key={i} className={cn("flex-1 h-1.5 rounded-full", trained ? "bg-burgundy" : "bg-stone-border")} />;
          })}
        </div>
        <div className="flex justify-between mt-1">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            const label = d.toLocaleDateString(localeToIntl(locale), { weekday: "short" }).slice(0, 1).toUpperCase();
            return <span key={i} className="flex-1 text-center text-[8px] text-stone-text/50">{label}</span>;
          })}
        </div>
      </div>

      {/* Today focus */}
      <div className="bg-bg-card border border-stone-border rounded-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-stone-text">{t.dashboard.todayFocus}</span>
          <button onClick={() => setFocusEdit(!focusEdit)} className="text-[10px] text-burgundy hover:text-burgundy-light uppercase tracking-wider">
            {focusEdit ? t.dashboard.cancel : t.dashboard.edit}
          </button>
        </div>
        {focusEdit ? (
          <div className="flex gap-2">
              <input ref={focusRef} value={focusVal} onChange={e => setFocusVal(e.target.value)} onKeyDown={e => e.key === "Enter" && saveFocus()} placeholder={t.dashboard.noFocusSet} className="flex-1 bg-bg-elevated border border-stone-border rounded-sm px-3 py-1.5 text-sm text-beige-warm placeholder:text-stone-text/50 focus:outline-none focus:border-amber" maxLength={200} />
            <button onClick={saveFocus} className="bg-burgundy text-beige-surface text-xs font-bold uppercase px-3 py-1.5 rounded-sm hover:bg-burgundy-light">{t.dashboard.ok}</button>
          </div>
        ) : (
          <p className={cn("text-sm", user?.todayFocus ? "text-beige-warm" : "text-stone-text/50 italic")}>
              {user?.todayFocus ?? t.dashboard.noFocusSet}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-card border border-stone-border rounded-sm p-3">
          <div className="text-[10px] text-stone-text uppercase tracking-widest mb-1">{t.mock.thisWeek}</div>
          <div className="font-condensed font-black text-2xl text-amber">{weeklySessions.length}<span className="text-sm font-normal text-stone-text ml-1">{t.mock.sessions}</span></div>
        </div>
        <div className="bg-bg-card border border-stone-border rounded-sm p-3">
          <div className="text-[10px] text-stone-text uppercase tracking-widest mb-1">{t.mock.volume}</div>
          <div className="font-condensed font-black text-2xl text-burgundy-light">{weeklyMinutes}<span className="text-sm font-normal text-stone-text ml-1">{t.dashboard.minutes}</span></div>
        </div>
      </div>

      {/* Volume chart */}
      {chartData.length > 0 && (
        <div className="bg-bg-card border border-stone-border rounded-sm p-4">
          <div className="text-[10px] text-stone-text uppercase tracking-widest mb-3">{t.dashboard.recentSessionsVolume}</div>
          <MetricChart data={chartData} color="#8b2635" height={120} />
        </div>
      )}

      {/* Friends tips preview */}
      {tips.length > 0 && (
        <div className="bg-bg-card border border-stone-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest text-stone-text">{t.dashboard.teammateTips}</span>
            <Link href="/dashboard/community" className="text-[10px] text-burgundy hover:text-burgundy-light uppercase tracking-wider">{t.dashboard.viewAll}</Link>
          </div>
          <div className="space-y-2">
            {tips.slice(0, 3).map(tip => (
              <div key={tip.sessionId} className="bg-bg-elevated rounded-sm p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-beige-warm">{tip.authorName}</span>
                  <span className="text-[10px] text-stone-text">{formatDate(tip.date)}</span>
                </div>
                <p className="text-xs text-stone-text/90 leading-relaxed">{tip.tacticNote}</p>
                <button onClick={() => toggleRespeto(tip.sessionId)} className={cn("mt-2 text-[10px] flex items-center gap-1 uppercase tracking-wider transition-colors", tip.hasRespeto ? "text-burgundy" : "text-stone-text/50 hover:text-stone-text")}>
                  <span>{tip.hasRespeto ? "♥" : "♡"}</span>
                  <span>{tip.respetos} {locale === "es" ? `respeto${tip.respetos !== 1 ? "s" : ""}` : `respect${tip.respetos !== 1 ? "s" : ""}`}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last session */}
      {last && (
        <div className="bg-bg-card border border-stone-border rounded-sm p-4">
          <div className="text-[10px] text-stone-text uppercase tracking-widest mb-3">{t.dashboard.lastSession}</div>
          <div className="flex items-center gap-2 mb-2"><Badge label={last.type} /><span className="text-xs text-stone-text">{formatDate(last.date)}</span></div>
          <div className="grid grid-cols-3 gap-2">
            <div><div className="text-[9px] text-stone-text uppercase">{t.dashboard.duration}</div><div className="font-condensed font-bold text-lg text-beige-surface">{last.duration}<span className="text-[10px] text-stone-text">{t.dashboard.minutes}</span></div></div>
            <div><div className="text-[9px] text-stone-text uppercase">Int.</div><div className="font-condensed font-bold text-lg text-amber">{last.intensity}<span className="text-[10px] text-stone-text">/10</span></div></div>
            <div><div className="text-[9px] text-stone-text uppercase">{t.dashboard.energy}</div><div className="font-condensed font-bold text-lg text-beige-surface">{last.energyBefore}→{last.energyAfter}</div></div>
          </div>
          {last.mainFocus && <p className="text-xs text-stone-text mt-2 italic">&ldquo;{last.mainFocus}&rdquo;</p>}
        </div>
      )}

      {/* Recent sessions list */}
      {sessions.length > 1 && (
        <div className="bg-bg-card border border-stone-border rounded-sm">
          <div className="px-4 pt-4 pb-2 text-[10px] text-stone-text uppercase tracking-widest">{isEs ? "Historial reciente" : "Recent history"}</div>
          {sessions.slice(1, 6).map(s => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-stone-border/40">
              <Badge label={s.type} />
              <span className="text-xs text-stone-text">{formatDate(s.date)}</span>
              <span className="text-xs text-beige-warm ml-auto">{s.duration}m · {s.intensity}/10</span>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setFabOpen(true)} className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-14 h-14 bg-burgundy hover:bg-burgundy-light text-beige-surface rounded-full shadow-lg flex items-center justify-center text-2xl font-light transition-all active:scale-95">
        +
      </button>

      {/* Quick log modal */}
      <Modal open={fabOpen} onClose={() => setFabOpen(false)} title={isEs ? "Registrar Entreno" : "Log Session"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={isEs ? "Fecha" : "Date"} type="date" value={form.date} onChange={f("date")} />
          <div className="flex flex-col gap-1"><label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{isEs ? "Tipo" : "Type"}</label><Select value={form.type} onChange={f("type")}>{TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</Select></div>
          <Input label={isEs ? "Duración (min)" : "Duration (min)"} type="number" min={1} value={form.duration} onChange={f("duration")} />
          <div className="flex flex-col gap-1"><label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{isEs ? `Sensación física (1-5): ${form.physicalState}` : `Physical state (1-5): ${form.physicalState}`}</label><input title="Physical state" type="range" min={1} max={5} value={form.physicalState} onChange={f("physicalState")} /></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{isEs ? `Intensidad (1-10): ${form.intensity}` : `Intensity (1-10): ${form.intensity}`}</label><input title="Intensity" type="range" min={1} max={10} value={form.intensity} onChange={f("intensity")} /></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{isEs ? `Energía antes (1-10): ${form.energyBefore}` : `Energy before (1-10): ${form.energyBefore}`}</label><input title="Energy before" type="range" min={1} max={10} value={form.energyBefore} onChange={f("energyBefore")} /></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{isEs ? `Energía después (1-10): ${form.energyAfter}` : `Energy after (1-10): ${form.energyAfter}`}</label><input title="Energy after" type="range" min={1} max={10} value={form.energyAfter} onChange={f("energyAfter")} /></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{isEs ? `Agujetas (1-10): ${form.soreness}` : `Soreness (1-10): ${form.soreness}`}</label><input title="Soreness" type="range" min={1} max={10} value={form.soreness} onChange={f("soreness")} /></div>
          <Input label={isEs ? "Foco del entreno" : "Session focus"} value={form.dailyFocus ?? ""} onChange={f("dailyFocus")} placeholder={isEs ? "ej: Mantener guardia alta" : "e.g. Keep high guard"} className="sm:col-span-2" />
          <Textarea label={isEs ? "Nota táctica (opcional)" : "Tactical note (optional)"} value={form.tacticNote ?? ""} onChange={f("tacticNote")} rows={2} placeholder={isEs ? "Algo que descubriste hoy..." : "Something you discovered today..."} className="sm:col-span-2" />
          {form.tacticNote && (
            <label className="sm:col-span-2 flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.tacticPublic} onChange={e => setForm(p => ({ ...p, tacticPublic: e.target.checked }))} className="w-4 h-4 accent-burgundy" />
              <span className="text-xs text-stone-text">{isEs ? "Compartir con mis aliados" : "Share with my teammates"}</span>
            </label>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setFabOpen(false)}>{isEs ? "Cancelar" : "Cancel"}</Button>
          <Button onClick={saveSession} disabled={saving}>{saving ? (isEs ? "Guardando…" : "Saving…") : (isEs ? "Guardar" : "Save")}</Button>
        </div>
      </Modal>
    </div>
  );
}
