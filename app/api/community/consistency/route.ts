import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// GET /api/community/consistency — friends' weekly training frequency
export async function GET() {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const friendships = await prisma.friendship.findMany({
    where: { userId: me.userId },
    include: {
      friend: {
        select: {
          id: true,
          name: true,
          gymName: true,
          trainingSessions: {
            where: { date: { gte: weekAgo } },
            select: { id: true, date: true, duration: true },
          },
        },
      },
    },
  });

  const board = friendships
    .map((f) => ({
      id: f.friend.id,
      name: f.friend.name,
      gymName: f.friend.gymName,
      weeklyCount: f.friend.trainingSessions.length,
      weeklyMinutes: f.friend.trainingSessions.reduce(
        (sum, s) => sum + s.duration,
        0
      ),
    }))
    .sort((a, b) => b.weeklyCount - a.weeklyCount);

  return NextResponse.json(board);
}
