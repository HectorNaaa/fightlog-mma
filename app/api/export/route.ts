import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [sessions, metrics, techniques, gameplans, sparring] = await Promise.all([
    prisma.trainingSession.findMany({ where: { userId: user.userId }, orderBy: { date: "desc" } }),
    prisma.physicalMetric.findMany({ where: { userId: user.userId }, orderBy: { date: "desc" } }),
    prisma.technique.findMany({ where: { userId: user.userId }, orderBy: { createdAt: "desc" } }),
    prisma.gameplan.findMany({ where: { userId: user.userId }, orderBy: { createdAt: "desc" } }),
    prisma.sparringSession.findMany({ where: { userId: user.userId }, orderBy: { date: "desc" } }),
  ]);

  const wb = XLSX.utils.book_new();

  // Training Log sheet
  const trainingData = sessions.map((s) => ({
    Date: new Date(s.date).toLocaleDateString(),
    Type: s.type,
    "Duration (min)": s.duration,
    Intensity: s.intensity,
    "Energy Before": s.energyBefore,
    "Energy After": s.energyAfter,
    Soreness: s.soreness,
    "Body Weight": s.bodyWeight ?? "",
    Mood: s.mood ?? "",
    "Main Focus": s.mainFocus ?? "",
    Notes: s.notes ?? "",
    "Coach Feedback": s.coachFeedback ?? "",
    "Personal Rating": s.personalRating ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trainingData), "Training Log");

  // Physical Metrics sheet
  const metricsData = metrics.map((m) => ({
    Date: new Date(m.date).toLocaleDateString(),
    "Body Weight": m.bodyWeight ?? "",
    "Resting HR": m.restingHeartRate ?? "",
    "Sleep Hours": m.sleepHours ?? "",
    "Sleep Quality": m.sleepQuality ?? "",
    Calories: m.calories ?? "",
    "Strength Notes": m.strengthNotes ?? "",
    "Cardio Notes": m.cardioNotes ?? "",
    Injuries: m.injuries ?? "",
    "Recovery Score": m.recoveryScore ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metricsData), "Physical Metrics");

  // Technical Tracker sheet
  const techData = techniques.map((t) => ({
    Category: t.category,
    Name: t.name,
    Setup: t.setup ?? "",
    Counter: t.counter ?? "",
    "Common Mistake": t.commonMistake ?? "",
    "Success Rate %": t.successRate ?? "",
    Confidence: t.confidence ?? "",
    Notes: t.notes ?? "",
    "Video URL": t.videoUrl ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(techData), "Techniques");

  // Gameplans sheet
  const gameplanData = gameplans.map((g) => ({
    Name: g.name,
    "Start Position": g.startPosition ?? "",
    Trigger: g.trigger ?? "",
    Action: g.action ?? "",
    "Follow-up A": g.followUpA ?? "",
    "Follow-up B": g.followUpB ?? "",
    "Counter Risk": g.counterRisk ?? "",
    "Best Against": g.bestAgainst ?? "",
    Notes: g.notes ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gameplanData), "Gameplans");

  // Sparring Reviews sheet
  const sparringData = sparring.map((s) => ({
    Date: new Date(s.date).toLocaleDateString(),
    "Partner Style": s.partnerStyle ?? "",
    Rounds: s.rounds ?? "",
    "Round Length": s.roundLength ?? "",
    "Dominant Moments": s.dominantMoments ?? "",
    Mistakes: s.mistakes ?? "",
    "Best Techniques": s.bestTechniques ?? "",
    "Techniques Failed": s.techniquesFailed ?? "",
    "Damage Taken": s.damageTaken ?? "",
    "Cardio Rating": s.cardioRating ?? "",
    "Composure Rating": s.composureRating ?? "",
    "Defense Rating": s.defenseRating ?? "",
    "Overall Rating": s.overallRating ?? "",
    Lessons: s.lessons ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sparringData), "Sparring Reviews");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="fightlog-export-${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  });
}
