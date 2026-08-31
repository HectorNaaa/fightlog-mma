import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { areFriends } from "@/lib/social";

// GET /api/messages/[friendId] — fetch the conversation thread with a
// connected friend and mark their messages to me as read.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { friendId } = await params;
    if (!(await areFriends(me.userId, friendId))) {
      return NextResponse.json({ error: "You can only message connected fighters" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: me.userId, receiverId: friendId },
          { senderId: friendId, receiverId: me.userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    await prisma.message.updateMany({
      where: { senderId: friendId, receiverId: me.userId, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[messages/friendId:get] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
