import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function computeStreak(sessions: { date: Date }[]): number {
  if (sessions.length === 0) return 0;
  const sorted = [...sessions]
    .map((s) => {
      const d = new Date(s.date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .reverse();

  let streak = 0;
  const today = new Date();
  let check = new Date(today);

  for (const day of sorted) {
    const checkKey = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
    if (day === checkKey) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      if (streak === 0) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;
        if (day === yKey) {
          streak++;
          check = new Date(yesterday);
          check.setDate(check.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }
  return streak;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        gymName: true,
        todayFocus: true,
        trainingSessions: { select: { date: true }, orderBy: { date: "desc" } },
      },
    });

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const streak = computeStreak(dbUser.trainingSessions);

    return NextResponse.json({
      user: {
        userId: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        level: dbUser.level,
        gymName: dbUser.gymName,
        todayFocus: dbUser.todayFocus,
        streak,
      },
    });
  } catch (error) {
    console.error("[auth/me] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
