import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { areFriends, canViewByVisibility } from "@/lib/social";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const node = await prisma.techniqueNode.findUnique({
      where: { id },
      select: { id: true, title: true, createdById: true, visibility: true },
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

    const existing = await prisma.techniqueNodeLike.findUnique({
      where: { nodeId_userId: { nodeId: id, userId: me.userId } },
    });

    if (existing) {
      await prisma.techniqueNodeLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    await prisma.techniqueNodeLike.create({
      data: { nodeId: id, userId: me.userId },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("[technique-nodes/like] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
