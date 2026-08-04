import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push-server";

export const dynamic = "force-dynamic";

// GET /api/cron/reminders — triggered daily by Vercel Cron (see vercel.json).
// Sends a push notification to every user who has enabled daily training
// reminders and selected today's weekday. Protected by CRON_SECRET: Vercel
// automatically sends `Authorization: Bearer <CRON_SECRET>` for Cron Jobs
// when that env var is configured on the project.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const today = new Date();
  const todayDow = today.getUTCDay(); // 0=Sun..6=Sat
  const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const candidates = await prisma.user.findMany({
    where: { reminderEnabled: true },
    select: { id: true, reminderDays: true, lastReminderSentAt: true },
  });

  const dueUsers = candidates.filter((u) => {
    const days = (u.reminderDays || "").split(",").map((d) => d.trim()).filter(Boolean);
    const isDueToday = days.includes(String(todayDow));
    const alreadySentToday = u.lastReminderSentAt && u.lastReminderSentAt >= startOfToday;
    return isDueToday && !alreadySentToday;
  });

  let sent = 0;
  for (const user of dueUsers) {
    await sendPushToUser(user.id, {
      title: "FightLog — Log your session / Registra tu entreno",
      body: "Don't forget to log today's training or fight. · No olvides anotar tu entreno o pelea de hoy.",
      url: "/dashboard",
      tag: "daily-reminder",
    });
    sent++;
  }

  if (dueUsers.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: dueUsers.map((u) => u.id) } },
      data: { lastReminderSentAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true, sent });
}
