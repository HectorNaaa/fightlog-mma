import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// DELETE /api/friends/[id] — remove a friend by friendshipId
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Find the friendship and verify ownership
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship || friendship.userId !== me.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Remove both directions
  await prisma.$transaction([
    prisma.friendship.delete({ where: { id } }),
    prisma.friendship.deleteMany({
      where: { userId: friendship.friendId, friendId: me.userId },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
