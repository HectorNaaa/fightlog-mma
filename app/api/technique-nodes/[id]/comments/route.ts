import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { areFriends, canViewByVisibility } from "@/lib/social";

const commentSchema = z.object({
  content: z.string().min(1).max(800),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = commentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
    }

    const { id } = await params;
    const node = await prisma.techniqueNode.findUnique({
      where: { id },
      select: { id: true, createdById: true, visibility: true, title: true },
    });

    if (!node) return NextResponse.json({ error: "Technique node not found" }, { status: 404 });

    const isFriend = await areFriends(me.userId, node.createdById);
    const canView = canViewByVisibility({
      ownerId: node.createdById,
      viewerId: me.userId,
      visibility: node.visibility,
      isFriend,
    });

    if (!canView) {
      return NextResponse.json({ error: "You do not have access to this node" }, { status: 403 });
    }

    const comment = await prisma.techniqueComment.create({
      data: {
        nodeId: node.id,
        userId: me.userId,
        content: parsed.data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: { select: { username: true, displayName: true } },
          },
        },
      },
    });

    await prisma.activityEvent.create({
      data: {
        userId: me.userId,
        eventType: "knowledge.node.commented",
        message: `Commented on ${node.title}`,
        metadata: { nodeId: node.id },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("[technique-nodes/comment] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
