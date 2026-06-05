"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { MetricChart } from "@/components/charts/metric-chart";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

interface TrainingSession {
  id: string;
  date: string;
  type: string;
  duration: number;
  intensity: number;
  soreness: number;
  energyBefore: number;
  energyAfter: number;
  mainFocus?: string | null;
  personalRating?: number | null;
}

function getWeekRange(offsetWeeks = 0) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() - offsetWeeks * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default function WeeklyReviewPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetch("/api/training").then((r) => r.json()).then((d) => setSessions(Array.isArray(d) ? d : []));
  }, []);

  const isIntermediate = user?.level === "intermediate";
  const { start, end } = getWeekRange(weekOffset);

  const weekSessions = sessions.filter((s) => {
    const d = new Date(s.date);
    return d >= start && d <= end;
  });

  const totalMin = weekSessions.reduce((a, s) => a + s.duration, 0);
  const avgIntensity = weekSessions.length
    ? (weekSessions.reduce((a, s) => a + s.intensity, 0) / weekSessions.length).toFixed(1)
    : "—";
  const avgRecovery = weekSessions.length
    ? (10 - weekSessions.reduce((a, s) => a + s.soreness, 0) / weekSessions.length).toFixed(1)
    : "—";

  const volumeByDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => ({
    label: day,
    value: weekSessions.filter((s) => new Date(s.date).getDay() === i).reduce((a, s) => a + s.duration, 0),
  }));

  const typeFreq: Record<string, number> = {};
  weekSessions.forEach((s) => { typeFreq[s.type] = (typeFreq[s.type] ?? 0) + 1; });
  const topType = Object.entries(typeFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const bestRated = weekSessions.filter((s) => s.personalRating).sort((a, b) => (b.personalRating ?? 0) - (a.personalRating ?? 0))[0];

  if (!isIntermediate) {
    return (
      <div>
        <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface mb-6">Weekly Review</h1>
        <div className="border border-navy/30 bg-navy/10 rounded-sm p-6 text-center max-w-lg mx-auto mt-10">
          <div className="text-4xl mb-3 opacity-30">□</div>
          <div className="font-condensed text-xl font-bold uppercase tracking-widest text-navy-light mb-2">Intermediate Feature</div>
          <p className="text-sm text-stone-text">Weekly Performance Review is available for Intermediate Amateur fighters.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface">Weekly Review</h1>
          <p className="text-sm text-stone-text mt-1">
            {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>← Prev</Button>
          {weekOffset > 0 && <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>This Week</Button>}
          {weekOffset > 0 && <Button variant="secondary" size="sm" onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}>Next →</Button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Sessions" value={weekSessions.length} accent="amber" />
        <StatCard label="Total Minutes" value={totalMin} unit="min" accent="burgundy" />
        <StatCard label="Avg Intensity" value={avgIntensity} unit="/ 10" accent="navy" />
        <StatCard label="Avg Recovery" value={avgRecovery} unit="/ 10" />
      </div>

      {/* Volume chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader><div className="text-xs font-bold uppercase tracking-widest text-stone-text">Volume by Day</div></CardHeader>
            <CardBody>
              <MetricChart data={volumeByDay} color="#8b2635" height={160} />
            </CardBody>
          </Card>
        </div>
        <Card>
          <CardHeader><div className="text-xs font-bold uppercase tracking-widest text-stone-text">Week Summary</div></CardHeader>
          <CardBody>
            <div className="space-y-3 text-sm">
              <SummaryRow label="Most trained" value={topType} />
              <SummaryRow label="Best session" value={bestRated ? `${bestRated.type} on ${formatDate(bestRated.date)}` : "—"} />
              <SummaryRow label="Sessions/week" value={`${weekSessions.length} sessions`} />
              <SummaryRow label="Total time" value={`${Math.floor(totalMin / 60)}h ${totalMin % 60}m`} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Session list */}
      <Card>
        <CardHeader><div className="text-xs font-bold uppercase tracking-widest text-stone-text">Sessions This Week</div></CardHeader>
        <CardBody className="p-0">
          {weekSessions.length === 0 ? (
            <div className="p-6 text-center text-stone-text text-sm">No sessions in this week.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Intensity</th>
                  <th>Focus</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {weekSessions.map((s) => (
                  <tr key={s.id}>
                    <td className="text-stone-text">{new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</td>
                    <td><Badge label={s.type} /></td>
                    <td>{s.duration}m</td>
                    <td>{s.intensity}/10</td>
                    <td className="text-stone-text">{s.mainFocus ?? "—"}</td>
                    <td>{s.personalRating ?? "—"}/10</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-stone-border/40 last:border-0">
      <span className="text-stone-text text-xs uppercase tracking-wider">{label}</span>
      <span className="text-beige-warm text-xs font-semibold">{value}</span>
    </div>
  );
}
