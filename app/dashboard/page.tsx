"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { MetricChart } from "@/components/charts/metric-chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatDate, formatDateInput, TRAINING_TYPES, DISCIPLINES, FIGHT_RESULTS, FIGHT_METHODS, EXERCISE_LOG_TYPES } from "@/lib/utils";
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

interface ExerciseSet { weight: number | null; reps: number | null; rpe: number | null; }
interface Exercise { name: string; sets: ExerciseSet[]; }
interface Session { id: string; date: string; type: string; duration: number; intensity: number; energyBefore: number; energyAfter: number; soreness: number; mainFocus?: string | null; personalRating?: number | null; isFight?: boolean; opponentName?: string | null; fightResult?: string | null; fightMethod?: string | null; exercises?: Exercise[] | null; }
interface Tip { sessionId: string; authorName: string; gymName?: string | null; date: string; type: string; tacticNote: string | null; respetos: number; hasRespeto: boolean; }

interface ExerciseSetForm { weight: string; reps: string; rpe: string; }
interface ExerciseForm { name: string; sets: ExerciseSetForm[]; }

const emptyForm = { date: "", type: "Boxing", duration: 60, intensity: 7, energyBefore: 7, energyAfter: 6, soreness: 5, bodyWeight: null as number | null, mood: "", mainFocus: "", physicalState: 3, dailyFocus: "", tacticNote: "", tacticPublic: false, isFight: false, opponentName: "", fightResult: "", fightMethod: "", exercises: [] as ExerciseForm[] };

const TRAINING_DRAFT_KEY = "fightlog:training-draft";

export default function DashboardPage() {
  const { user, refetch } = useAuth();
  const { locale, t } = useLanguage();
  const isEs = locale === "es";

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
      case "uk":
        return "uk-UA";
      default:
        return "en-US";
    }
  }
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [fabOpen, setFabOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [logFilter, setLogFilter] = useState<"all" | "training" | "fights">("all");
  const [form, setForm] = useState({ ...emptyForm, date: formatDateInput(new Date()) });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [focusEdit, setFocusEdit] = useState(false);
  const [focusVal, setFocusVal] = useState("");
  const focusRef = useRef<HTMLInputElement>(null);

  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [selectedDisc, setSelectedDisc] = useState("");
  const [loadingDisc, setLoadingDisc] = useState(false);

  // Unsaved-changes protection for the training/fight log form: keeps a
  // localStorage draft so an accidental exit (closed tab, phone power off,
  // etc.) doesn't lose a long training entry.
  const [dirty, setDirty] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState<null | { form: typeof form; editingSessionId: string | null }>(null);
  const justOpenedRef = useRef(false);

  const load = async () => {
    const [s, t] = await Promise.all([
      fetch("/api/training").then(r => r.json()).catch(() => []),
      fetch("/api/community/tips").then(r => r.json()).catch(() => []),
    ]);
    setSessions(Array.isArray(s) ? s : []);
    setTips(Array.isArray(t) ? t : []);

    const prof = await fetch("/api/user/profile").then(r => r.ok ? r.json() : null).catch(() => null);
    setDisciplines(Array.isArray(prof?.disciplines) ? prof.disciplines : []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setFocusVal(user?.todayFocus ?? ""); }, [user]);
  useEffect(() => { if (focusEdit) focusRef.current?.focus(); }, [focusEdit]);

  // Look for a leftover draft from a previous accidental exit.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRAINING_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.form) setDraftPrompt(parsed);
      }
    } catch { /* ignore malformed/unavailable storage */ }
  }, []);

  // Continuously persist the in-progress form as a draft while it's dirty,
  // so we can recover it if the app/tab closes unexpectedly.
  useEffect(() => {
    if (!fabOpen || !dirty) return;
    try {
      localStorage.setItem(TRAINING_DRAFT_KEY, JSON.stringify({ form, editingSessionId: editingSession?.id ?? null }));
    } catch { /* ignore quota/unavailable storage */ }
  }, [form, fabOpen, dirty, editingSession]);

  // Detect real edits (vs. the initial state set when opening the modal).
  useEffect(() => {
    if (!fabOpen) return;
    if (justOpenedRef.current) { justOpenedRef.current = false; return; }
    setDirty(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Warn on browser/tab close while there are unsaved changes.
  useEffect(() => {
    if (!fabOpen || !dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [fabOpen, dirty]);

  const discardTrainingDraft = () => {
    try { localStorage.removeItem(TRAINING_DRAFT_KEY); } catch { /* ignore */ }
  };

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

  const addDisc = async () => {
    if (!selectedDisc || loadingDisc) return;
    const next = Array.from(new Set([...disciplines, selectedDisc]));
    setLoadingDisc(true);
    await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ disciplines: next }) }).catch(() => null);
    setDisciplines(next);
    setSelectedDisc("");
    setLoadingDisc(false);
  };

  const removeDisc = async (name: string) => {
    const next = disciplines.filter(d => d !== name);
    setDisciplines(next);
    await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ disciplines: next }) }).catch(() => null);
  };

  const saveSession = async () => {
    setSaving(true);
    const exercises = (EXERCISE_LOG_TYPES as readonly string[]).includes(form.type) && form.exercises.length > 0
      ? form.exercises
          .filter((ex) => ex.name.trim())
          .map((ex) => ({
            name: ex.name.trim(),
            sets: ex.sets.map((s) => ({
              weight: s.weight.trim() ? Number(s.weight) : null,
              reps: s.reps.trim() ? Number(s.reps) : null,
              rpe: s.rpe.trim() ? Number(s.rpe) : null,
            })),
          }))
      : undefined;
    const payload = { ...form, duration: Number(form.duration), intensity: Number(form.intensity), energyBefore: Number(form.energyBefore), energyAfter: Number(form.energyAfter), soreness: Number(form.soreness), physicalState: Number(form.physicalState), tacticPublic: form.tacticPublic, isFight: form.isFight, exercises };
    const url = editingSession ? `/api/training/${editingSession.id}` : "/api/training";
    const method = editingSession ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await load();
    await refetch();
    setFabOpen(false);
    setSaving(false);
    setEditingSession(null);
    setDirty(false);
    setDraftPrompt(null);
    discardTrainingDraft();
    setForm({ ...emptyForm, date: formatDateInput(new Date()) });
  };

  // Closing the log modal (Cancel, ×, Escape, backdrop click) — confirm if
  // there are unsaved changes. The draft stays in localStorage either way so
  // it can be recovered later; it's only cleared on save or explicit discard.
  const requestCloseLog = () => {
    if (dirty) {
      const msg = isEs
        ? "Tienes cambios sin guardar en este entreno. Se guardó un borrador y podrás continuarlo más tarde. ¿Seguro que quieres salir?"
        : "You have unsaved changes in this session. A draft was saved and you can continue it later. Are you sure you want to leave?";
      if (!window.confirm(msg)) return;
    }
    setFabOpen(false);
    setDirty(false);
    setEditingSession(null);
    setForm({ ...emptyForm, date: formatDateInput(new Date()) });
  };

  const openNewLog = (isFight = false) => {
    justOpenedRef.current = true;
    setDirty(false);
    setEditingSession(null);
    setForm({ ...emptyForm, date: formatDateInput(new Date()), isFight });
    setFabOpen(true);
  };

  const continueDraft = () => {
    if (!draftPrompt) return;
    justOpenedRef.current = true;
    setEditingSession(null);
    setForm(draftPrompt.form);
    setFabOpen(true);
    setDirty(true);
    setDraftPrompt(null);
  };

  const discardDraftPrompt = () => {
    discardTrainingDraft();
    setDraftPrompt(null);
  };

  const openEditLog = (s: Session) => {
    justOpenedRef.current = true;
    setDirty(false);
    setEditingSession(s);
    setForm({
      ...emptyForm,
      date: formatDateInput(s.date),
      type: s.type,
      duration: s.duration,
      intensity: s.intensity,
      energyBefore: s.energyBefore,
      energyAfter: s.energyAfter,
      soreness: s.soreness,
      mainFocus: s.mainFocus ?? "",
      isFight: !!s.isFight,
      opponentName: s.opponentName ?? "",
      fightResult: s.fightResult ?? "",
      fightMethod: s.fightMethod ?? "",
      exercises: Array.isArray(s.exercises)
        ? s.exercises.map((ex) => ({
            name: ex.name,
            sets: ex.sets.map((set) => ({ weight: set.weight != null ? String(set.weight) : "", reps: set.reps != null ? String(set.reps) : "", rpe: set.rpe != null ? String(set.rpe) : "" })),
          }))
        : [],
    });
    setFabOpen(true);
  };

  const addExercise = () => setForm((p) => ({ ...p, exercises: [...p.exercises, { name: "", sets: [{ weight: "", reps: "", rpe: "" }] }] }));
  const removeExercise = (i: number) => setForm((p) => ({ ...p, exercises: p.exercises.filter((_, idx) => idx !== i) }));
  const updateExerciseName = (i: number, name: string) => setForm((p) => ({ ...p, exercises: p.exercises.map((ex, idx) => (idx === i ? { ...ex, name } : ex)) }));
  const addSet = (i: number) => setForm((p) => ({ ...p, exercises: p.exercises.map((ex, idx) => (idx === i ? { ...ex, sets: [...ex.sets, { weight: "", reps: "", rpe: "" }] } : ex)) }));
  const removeSet = (i: number, j: number) => setForm((p) => ({ ...p, exercises: p.exercises.map((ex, idx) => (idx === i ? { ...ex, sets: ex.sets.filter((_, sIdx) => sIdx !== j) } : ex)) }));
  const updateSet = (i: number, j: number, field: "weight" | "reps" | "rpe", value: string) =>
    setForm((p) => ({
      ...p,
      exercises: p.exercises.map((ex, idx) =>
        idx === i ? { ...ex, sets: ex.sets.map((s, sIdx) => (sIdx === j ? { ...s, [field]: value } : s)) } : ex
      ),
    }));


  const deleteSession = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/training/${id}`, { method: "DELETE" });
    await load();
    await refetch();
    setDeletingId(null);
  };

  const toggleRespeto = async (sessionId: string) => {
    await fetch(`/api/tips/${sessionId}/respeto`, { method: "POST" });
    setTips(prev => prev.map(t => t.sessionId === sessionId ? { ...t, respetos: t.hasRespeto ? t.respetos - 1 : t.respetos + 1, hasRespeto: !t.hasRespeto } : t));
  };

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(p => ({ ...p, [field]: e.target.value }));

  const filteredSessions = sessions.filter(s => logFilter === "all" ? true : logFilter === "fights" ? !!s.isFight : !s.isFight);

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

      {/* Recovered draft banner (accidental exit protection) */}
      {draftPrompt && !draftPrompt.editingSessionId && !fabOpen && (
        <div className="rounded-sm p-3 border border-burgundy/40 bg-burgundy/10 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-beige-warm">
            {isEs ? "Encontramos un entreno sin guardar de la última vez. ¿Quieres continuarlo?" : "We found an unsaved training session from last time. Continue it?"}
          </p>
          <div className="flex gap-2 shrink-0">
            <button onClick={continueDraft} className="bg-burgundy text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm hover:bg-burgundy-light transition-colors">
              {isEs ? "Continuar" : "Continue"}
            </button>
            <button onClick={discardDraftPrompt} className="border border-stone-border text-stone-text text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm hover:text-beige-warm transition-colors">
              {isEs ? "Descartar" : "Discard"}
            </button>
          </div>
        </div>
      )}

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
            <button onClick={saveFocus} className="bg-burgundy text-white text-xs font-bold uppercase px-3 py-1.5 rounded-sm hover:bg-burgundy-light">{t.dashboard.ok}</button>
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

      {/* Disciplines */}
      <div className="bg-bg-card border border-stone-border rounded-sm p-4">
        <div className="text-[10px] text-stone-text uppercase tracking-widest mb-3">{isEs ? "Mis deportes y disciplinas" : "My Sports & Disciplines"}</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {disciplines.length === 0 && <span className="text-xs text-stone-text/50 italic">{isEs ? "Sin disciplinas adicionales" : "No additional disciplines added"}</span>}
          {disciplines.map(d => (
            <button key={d} onClick={() => removeDisc(d)} title={isEs ? `Eliminar ${d}` : `Remove ${d}`} className="text-[11px] bg-bg-elevated border border-stone-border px-2.5 py-1 rounded-sm text-beige-warm flex items-center gap-1.5 hover:border-burgundy/60 hover:text-white transition-colors">
              {d} <span className="text-stone-text/60 text-xs">×</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={selectedDisc}
            onChange={e => setSelectedDisc(e.target.value)}
            title={isEs ? "Seleccionar disciplina" : "Select discipline"}
            className="flex-1 bg-bg-elevated border border-stone-border rounded-sm px-3 py-1.5 text-sm text-beige-warm placeholder:text-stone-text focus:outline-none focus:border-amber"
          >
            <option value="">{isEs ? "Añadir disciplina..." : "Add discipline..."}</option>
            {DISCIPLINES.filter(d => !disciplines.includes(d)).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button
            onClick={addDisc}
            disabled={!selectedDisc || loadingDisc}
            className="bg-burgundy text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm hover:bg-burgundy-light disabled:opacity-50 transition-colors"
          >
            {isEs ? "Añadir" : "Add"}
          </button>
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

      {/* Full training & fight log (embedded, scrollable) */}
      <div className="bg-bg-card border border-stone-border rounded-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2 flex-wrap">
          <span className="text-[10px] text-stone-text uppercase tracking-widest">{isEs ? "Diario de entreno" : "Training log"} ({filteredSessions.length})</span>
          <div className="flex rounded-full border border-stone-border overflow-hidden">
            {(["all", "training", "fights"] as const).map(k => (
              <button
                key={k}
                onClick={() => setLogFilter(k)}
                className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors", logFilter === k ? "bg-burgundy text-white" : "text-stone-text hover:text-beige-warm")}
              >
                {k === "all" ? (isEs ? "Todo" : "All") : k === "training" ? (isEs ? "Entrenos" : "Training") : (isEs ? "Peleas" : "Fights")}
              </button>
            ))}
          </div>
        </div>
        {filteredSessions.length === 0 ? (
          <div className="px-4 pb-4 text-xs text-stone-text/60 italic">{isEs ? "Sin sesiones registradas todavía." : "No sessions logged yet."}</div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            {filteredSessions.map(s => (
              <div key={s.id} className="flex items-center gap-2 px-4 py-2.5 border-t border-stone-border/40">
                <button onClick={() => openEditLog(s)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                  {s.isFight ? (
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm shrink-0",
                      s.fightResult === "win" ? "bg-amber/20 text-amber" : s.fightResult === "loss" ? "bg-burgundy/20 text-burgundy-light" : "bg-navy/30 text-navy-light"
                    )}>
                      {isEs ? "Pelea" : "Fight"}{s.fightResult ? ` · ${s.fightResult}` : ""}
                    </span>
                  ) : (
                    <Badge label={s.type} />
                  )}
                  <span className="text-xs text-stone-text shrink-0">{formatDate(s.date)}</span>
                  {s.isFight && s.opponentName && <span className="text-xs text-beige-warm truncate">vs {s.opponentName}</span>}
                  {!s.isFight && (EXERCISE_LOG_TYPES as readonly string[]).includes(s.type) && Array.isArray(s.exercises) && s.exercises.length > 0 && (
                    <span className="text-[10px] text-stone-text/70 truncate">{s.exercises.length} {isEs ? "ejercicios" : "exercises"}</span>
                  )}
                  <span className="text-xs text-beige-warm ml-auto shrink-0">{s.duration}m · {s.intensity}/10</span>
                </button>
                <button
                  onClick={() => deleteSession(s.id)}
                  disabled={deletingId === s.id}
                  title={isEs ? "Borrar" : "Delete"}
                  className="shrink-0 text-stone-text/50 hover:text-burgundy-light text-xs px-1.5 py-1 transition-colors disabled:opacity-40"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => openNewLog(false)} className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-14 h-14 bg-burgundy hover:bg-burgundy-light text-white rounded-full shadow-lg flex items-center justify-center text-2xl font-light transition-all active:scale-95">
        +
      </button>

      {/* Quick log modal */}
      <Modal open={fabOpen} onClose={requestCloseLog} title={editingSession ? (isEs ? "Editar sesión" : "Edit Session") : form.isFight ? (isEs ? "Registrar Pelea" : "Log Fight") : (isEs ? "Registrar Entreno" : "Log Session")}>
        <div className="flex rounded-full border border-stone-border overflow-hidden mb-4 w-fit">
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, isFight: false }))}
            className={cn("px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors", !form.isFight ? "bg-burgundy text-white" : "text-stone-text hover:text-beige-warm")}
          >
            {isEs ? "Entreno" : "Training"}
          </button>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, isFight: true }))}
            className={cn("px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors", form.isFight ? "bg-burgundy text-white" : "text-stone-text hover:text-beige-warm")}
          >
            {isEs ? "Pelea" : "Fight"}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={isEs ? "Fecha" : "Date"} type="date" value={form.date} onChange={f("date")} />
          <div className="flex flex-col gap-1"><label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{isEs ? "Tipo" : "Type"}</label><Select value={form.type} onChange={f("type")}>{TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</Select></div>
          <Input label={isEs ? "Duración (min)" : "Duration (min)"} type="number" min={1} value={form.duration} onChange={f("duration")} />
          {form.isFight && (
            <>
              <Input label={isEs ? "Oponente" : "Opponent"} value={form.opponentName} onChange={f("opponentName")} placeholder={isEs ? "Nombre del rival" : "Opponent name"} />
              <div className="flex flex-col gap-1"><label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{isEs ? "Resultado" : "Result"}</label><Select value={form.fightResult} onChange={f("fightResult")}><option value="">{isEs ? "Selecciona..." : "Select..."}</option>{FIGHT_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}</Select></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-semibold uppercase tracking-wider text-stone-text">{isEs ? "Método" : "Method"}</label><Select value={form.fightMethod} onChange={f("fightMethod")}><option value="">{isEs ? "Selecciona..." : "Select..."}</option>{FIGHT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</Select></div>
            </>
          )}
          {(EXERCISE_LOG_TYPES as readonly string[]).includes(form.type) && !form.isFight && (
            <div className="sm:col-span-2 flex flex-col gap-3 border border-stone-border/50 rounded-sm p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-text">{isEs ? "Ejercicios (peso y repeticiones)" : "Exercises (weight & reps)"}</span>
                <button type="button" onClick={addExercise} className="text-[11px] bg-burgundy/20 border border-burgundy/50 text-burgundy-light px-2.5 py-1 rounded-sm hover:bg-burgundy/30 transition-colors">
                  + {isEs ? "Añadir ejercicio" : "Add Exercise"}
                </button>
              </div>
              {form.exercises.length === 0 && (
                <p className="text-xs text-stone-text/60 italic">{isEs ? "Añade los ejercicios de esta sesión de gimnasio/fuerza." : "Add the exercises for this gym/strength session."}</p>
              )}
              {form.exercises.map((ex, i) => (
                <div key={i} className="bg-bg-elevated rounded-sm p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={ex.name}
                      onChange={(e) => updateExerciseName(i, e.target.value)}
                      placeholder={isEs ? "Nombre del ejercicio (ej: Sentadilla)" : "Exercise name (e.g. Squat)"}
                      className="flex-1 bg-bg-card border border-stone-border rounded-sm px-2.5 py-1.5 text-sm text-beige-warm placeholder:text-stone-text/50 focus:outline-none focus:border-amber"
                    />
                    <button type="button" onClick={() => removeExercise(i)} title={isEs ? "Eliminar ejercicio" : "Remove exercise"} className="text-stone-text/50 hover:text-burgundy-light text-sm px-1.5">×</button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {ex.sets.map((set, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-text w-10 shrink-0">{isEs ? "Serie" : "Set"} {j + 1}</span>
                        <input
                          type="number"
                          value={set.weight}
                          onChange={(e) => updateSet(i, j, "weight", e.target.value)}
                          placeholder={isEs ? "Peso (kg)" : "Weight (kg)"}
                          className="w-24 bg-bg-card border border-stone-border rounded-sm px-2 py-1 text-xs text-beige-warm placeholder:text-stone-text/50 focus:outline-none focus:border-amber"
                        />
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(i, j, "reps", e.target.value)}
                          placeholder={isEs ? "Repes" : "Reps"}
                          className="w-20 bg-bg-card border border-stone-border rounded-sm px-2 py-1 text-xs text-beige-warm placeholder:text-stone-text/50 focus:outline-none focus:border-amber"
                        />
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={set.rpe}
                          onChange={(e) => updateSet(i, j, "rpe", e.target.value)}
                          placeholder={isEs ? "RPE" : "RPE"}
                          title={isEs ? "RPE (1-10)" : "RPE (1-10)"}
                          className="w-16 bg-bg-card border border-stone-border rounded-sm px-2 py-1 text-xs text-beige-warm placeholder:text-stone-text/50 focus:outline-none focus:border-amber"
                        />
                        <button type="button" onClick={() => removeSet(i, j)} title={isEs ? "Eliminar serie" : "Remove set"} className="text-stone-text/50 hover:text-burgundy-light text-xs px-1">×</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addSet(i)} className="text-[10px] text-amber hover:text-amber-light uppercase tracking-wider self-start">
                    + {isEs ? "Añadir serie" : "Add Set"}
                  </button>
                </div>
              ))}
            </div>
          )}
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
          <Button variant="secondary" onClick={requestCloseLog}>{isEs ? "Cancelar" : "Cancel"}</Button>
          <Button onClick={saveSession} disabled={saving}>{saving ? (isEs ? "Guardando…" : "Saving…") : editingSession ? (isEs ? "Actualizar" : "Update") : (isEs ? "Guardar" : "Save")}</Button>
        </div>
      </Modal>
    </div>
  );
}
