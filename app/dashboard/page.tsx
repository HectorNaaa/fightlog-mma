"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { StatCard } from "@/components/dashboard/stat-card";
import { MetricChart } from "@/components/charts/metric-chart";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface TrainingSession {
  id: string;
  date: string;
  type: string;
  duration: number;
  intensity: number;
  energyBefore: number;
  energyAfter: number;
  soreness: number;
  mainFocus?: string;
  personalRating?: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/training")
      .then((r) => r.json())
      .then((d) => { setSessions(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Compute weekly stats (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklySessions = sessions.filter((s) => new Date(s.date) >= oneWeekAgo);

  const weeklyMinutes = weeklySessions.reduce((a, s) => a + s.duration, 0);
  const avgIntensity = weeklySessions.length
    ? (weeklySessions.reduce((a, s) => a + s.intensity, 0) / weeklySessions.length).toFixed(1)
    : "—";
  const avgSoreness = weeklySessions.length
    ? (weeklySessions.reduce((a, s) => a + s.soreness, 0) / weeklySessions.length).toFixed(1)
    : "—";

  // Chart data: last 8 sessions volume
  const chartData = [...sessions]
    .reverse()
    .slice(-8)
    .map((s) => ({ label: formatDate(s.date).slice(0, 6), value: s.duration }));

  const intensityChart = [...sessions]
    .reverse()
    .slice(-8)
    .map((s) => ({ label: formatDate(s.date).slice(0, 6), value: s.intensity }));

  const last = sessions[0];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-condensed font-black text-3xl uppercase tracking-widest text-beige-surface">
            Dashboard
          </h1>
          <p className="text-sm text-stone-text mt-1">
            {user?.name} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/training-log">
            <Button size="sm">+ Log Session</Button>
          </Link>
          <a href="/api/export" download>
            <Button variant="secondary" size="sm">↓ Export</Button>
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Weekly Sessions" value={weeklySessions.length} accent="amber" />
        <StatCard label="Weekly Volume" value={weeklyMinutes} unit="min" accent="burgundy" />
        <StatCard label="Avg Intensity" value={avgIntensity} unit="/ 10" accent="navy" />
        <StatCard label="Avg Soreness" value={avgSoreness} unit="/ 10" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <div className="text-xs font-bold uppercase tracking-widest text-stone-text">
              Training Volume
            </div>
          </CardHeader>
          <CardBody>
            {chartData.length > 0 ? (
              <MetricChart data={chartData} color="#8b2635" height={160} />
            ) : (
              <EmptyState text="Log sessions to see volume trends" />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <div className="text-xs font-bold uppercase tracking-widest text-stone-text">
              Intensity Trend
            </div>
          </CardHeader>
          <CardBody>
            {intensityChart.length > 0 ? (
              <MetricChart data={intensityChart} color="#d4a017" type="line" height={160} />
            ) : (
              <EmptyState text="Log sessions to see intensity trends" />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Last session */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="text-xs font-bold uppercase tracking-widest text-stone-text">
                Recent Sessions
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {loading ? (
                <div className="p-4 text-stone-text text-sm">Loading…</div>
              ) : sessions.length === 0 ? (
                <div className="p-6 text-center">
                  <EmptyState text="No sessions logged yet. Start training!" />
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Duration</th>
                      <th>Intensity</th>
                      <th>Focus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 6).map((s) => (
                      <tr key={s.id}>
                        <td className="text-stone-text">{formatDate(s.date)}</td>
                        <td><Badge label={s.type} /></td>
                        <td>{s.duration}m</td>
                        <td>{s.intensity}/10</td>
                        <td className="text-stone-text truncate max-w-[120px]">{s.mainFocus ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Last session summary */}
        <Card>
          <CardHeader>
            <div className="text-xs font-bold uppercase tracking-widest text-stone-text">
              Last Session
            </div>
          </CardHeader>
          <CardBody>
            {last ? (
              <div className="space-y-3">
                <Badge label={last.type} />
                <div className="text-xs text-stone-text">{formatDate(last.date)}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-stone-text uppercase tracking-wider text-[10px]">Duration</div>
                    <div className="font-condensed font-bold text-xl text-beige-surface">{last.duration}<span className="text-xs text-stone-text"> min</span></div>
                  </div>
                  <div>
                    <div className="text-stone-text uppercase tracking-wider text-[10px]">Intensity</div>
                    <div className="font-condensed font-bold text-xl text-amber">{last.intensity}<span className="text-xs text-stone-text">/10</span></div>
                  </div>
                  <div>
                    <div className="text-stone-text uppercase tracking-wider text-[10px]">Energy ↑</div>
                    <div className="font-semibold">{last.energyBefore} → {last.energyAfter}</div>
                  </div>
                  <div>
                    <div className="text-stone-text uppercase tracking-wider text-[10px]">Soreness</div>
                    <div className="font-semibold">{last.soreness}/10</div>
                  </div>
                </div>
                {last.mainFocus && (
                  <div>
                    <div className="text-[10px] text-stone-text uppercase tracking-wider">Focus</div>
                    <div className="text-sm text-beige-warm">{last.mainFocus}</div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState text="No session data yet" />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
      <div className="text-2xl opacity-20">◎</div>
      <p className="text-xs text-stone-text">{text}</p>
    </div>
  );
}
