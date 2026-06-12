import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// GET /api/community/tips — public tactic notes from friends
export async function GET() {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get friend IDs
  const friendships = await prisma.friendship.findMany({
    where: { userId: me.userId },
    select: { friendId: true },
  });
  const friendIds = friendships.map((f) => f.friendId);

  if (friendIds.length === 0) return NextResponse.json([]);

  const tips = await prisma.trainingSession.findMany({
    where: {
      userId: { in: friendIds },
      tacticPublic: true,
      tacticNote: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      user: { select: { id: true, name: true, gymName: true } },
      respetos: { select: { userId: true } },
    },
  });

  const result = tips.map((t) => ({
    sessionId: t.id,
    authorId: t.user.id,
    authorName: t.user.name,
    gymName: t.user.gymName,
    date: t.date,
    type: t.type,
    tacticNote: t.tacticNote,
    respetos: t.respetos.length,
    hasRespeto: t.respetos.some((r) => r.userId === me.userId),
  }));

  return NextResponse.json(result);
}
