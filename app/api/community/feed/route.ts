import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const friendRows = await prisma.friendship.findMany({
      where: { userId: me.userId },
      select: { friendId: true },
    });
    const friendIds = friendRows.map((f) => f.friendId);

    const meProfile = await prisma.user.findUnique({
      where: { id: me.userId },
      select: { discipline: true, gymName: true },
    });

    const [events, topNodes, sameDisciplineUsers, gymPeersCount] = await Promise.all([
      prisma.activityEvent.findMany({
        where: {
          userId: { in: [me.userId, ...friendIds] },
        },
        take: 40,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: { select: { username: true, displayName: true } },
            },
          },
        },
      }),
      prisma.techniqueNode.findMany({
        where: {
          OR: [
            { visibility: "public" },
            { visibility: "friends", createdById: { in: friendIds } },
            { createdById: me.userId },
          ],
        },
        take: 6,
        orderBy: [{ saves: { _count: "desc" } }, { likes: { _count: "desc" } }, { createdAt: "desc" }],
        include: {
          discipline: { select: { name: true } },
          _count: { select: { saves: true, likes: true } },
        },
      }),
      prisma.user.findMany({
        where: {
          id: { notIn: [me.userId, ...friendIds] },
          discipline: meProfile?.discipline,
        },
        take: 6,
        select: {
          id: true,
          name: true,
          discipline: true,
          gymName: true,
          profile: { select: { username: true, displayName: true } },
        },
      }),
      prisma.user.count({
        where: {
          id: { not: me.userId },
          gymName: meProfile?.gymName ?? undefined,
        },
      }),
    ]);

    return NextResponse.json({
      events: events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        message: event.message,
        createdAt: event.createdAt,
        metadata: event.metadata,
        user: event.user,
      })),
      recommendations: {
        fightersYouMayKnow: sameDisciplineUsers,
        popularTechniqueNodes: topNodes.map((node) => ({
          id: node.id,
          title: node.title,
          discipline: node.discipline?.name ?? null,
          visibility: node.visibility,
          likes: node._count.likes,
          saves: node._count.saves,
        })),
        gymNetworkCount: gymPeersCount,
      },
    });
  } catch (error) {
    console.error("[community/feed] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
