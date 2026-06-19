import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getFriendIds } from "@/lib/social";

const createNodeSchema = z.object({
  title: z.string().min(2).max(120),
  discipline: z.string().min(1).max(60),
  position: z.string().max(80).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  visibility: z.enum(["private", "friends", "public"]).default("private"),
  linkedNodeIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const friendIds = await getFriendIds(me.userId);
    const query = req.nextUrl.searchParams.get("q")?.trim();

    const nodes = await prisma.techniqueNode.findMany({
      where: {
        OR: [
          { createdById: me.userId },
          { visibility: "public" },
          { visibility: "friends", createdById: { in: friendIds } },
        ],
        title: query ? { contains: query, mode: "insensitive" } : undefined,
      },
      take: 60,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            profile: { select: { username: true, displayName: true } },
          },
        },
        discipline: { select: { name: true } },
        outgoingEdges: { select: { toNodeId: true } },
        comments: {
          take: 3,
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
        },
        saves: { where: { userId: me.userId }, select: { id: true } },
        likes: { where: { userId: me.userId }, select: { id: true } },
        _count: { select: { saves: true, likes: true, comments: true } },
      },
    });

    return NextResponse.json(
      nodes.map((node) => ({
        id: node.id,
        title: node.title,
        discipline: node.discipline?.name ?? null,
        position: node.position,
        description: node.description,
        visibility: node.visibility,
        linkedNodeIds: node.outgoingEdges.map((edge) => edge.toNodeId),
        createdAt: node.createdAt,
        createdBy: node.createdBy,
        counts: node._count,
        hasSaved: node.saves.length > 0,
        hasLiked: node.likes.length > 0,
        comments: node.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: comment.user,
        })),
      }))
    );
  } catch (error) {
    console.error("[technique-nodes:get] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = createNodeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid node payload" }, { status: 400 });
    }

    const payload = parsed.data;

    const created = await prisma.$transaction(async (tx) => {
      const discipline = await tx.discipline.upsert({
        where: { name: payload.discipline },
        update: {},
        create: { name: payload.discipline },
      });

      const node = await tx.techniqueNode.create({
        data: {
          createdById: me.userId,
          disciplineId: discipline.id,
          title: payload.title,
          position: payload.position,
          description: payload.description,
          visibility: payload.visibility,
        },
      });

      const linkedNodeIds = Array.from(
        new Set((payload.linkedNodeIds || []).filter((id) => id !== node.id))
      );
      if (linkedNodeIds.length > 0) {
        await tx.techniqueEdge.createMany({
          data: linkedNodeIds.map((toNodeId) => ({ fromNodeId: node.id, toNodeId })),
          skipDuplicates: true,
        });
      }

      await tx.activityEvent.create({
        data: {
          userId: me.userId,
          eventType: "knowledge.node.created",
          message: `Added a new technique node: ${payload.title}`,
          metadata: {
            nodeId: node.id,
            visibility: payload.visibility,
            discipline: payload.discipline,
          },
        },
      });

      return node;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[technique-nodes:post] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
