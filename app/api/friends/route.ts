import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// GET /api/friends — list friends with their weekly session count
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
          level: true,
          trainingSessions: {
            where: { date: { gte: weekAgo } },
            select: { id: true, date: true, type: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const friends = friendships.map((f) => ({
    id: f.friend.id,
    friendshipId: f.id,
    name: f.friend.name,
    gymName: f.friend.gymName,
    level: f.friend.level,
    weeklySessionCount: f.friend.trainingSessions.length,
    lastSessions: f.friend.trainingSessions.slice(0, 3),
  }));

  return NextResponse.json(friends);
}

// POST /api/friends — add friend by email
export async function POST(req: NextRequest) {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const email = (body.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === me.userId) {
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
  }

  // Check if already friends
  const existing = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: me.userId, friendId: target.id } },
  });
  if (existing) return NextResponse.json({ error: "Already friends" }, { status: 409 });

  // Create bidirectional friendship
  await prisma.$transaction([
    prisma.friendship.create({ data: { userId: me.userId, friendId: target.id } }),
    prisma.friendship.create({ data: { userId: target.id, friendId: me.userId } }),
  ]);

  return NextResponse.json({ ok: true, name: target.name }, { status: 201 });
}
