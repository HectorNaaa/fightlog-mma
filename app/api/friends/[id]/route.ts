import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

const updateFriendSchema = z.object({
  isTrainingPartner: z.boolean(),
});

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

// PATCH /api/friends/[id] — update friendship flags
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = updateFriendSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship || friendship.userId !== me.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.friendship.update({
    where: { id },
    data: { isTrainingPartner: parsed.data.isTrainingPartner },
    select: { id: true, isTrainingPartner: true },
  });

  return NextResponse.json(updated);
}
