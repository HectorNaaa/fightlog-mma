import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { areFriends, getFriendIds } from "@/lib/social";
import { sendPushToUser } from "@/lib/push-server";

const sendSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().trim().min(1).max(2000),
});

// GET /api/messages — list one conversation summary per connected friend
// (last message + unread count), most recently active first.
export async function GET() {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const friendIds = await getFriendIds(me.userId);
    if (friendIds.length === 0) return NextResponse.json([]);

    const conversations = await Promise.all(
      friendIds.map(async (friendId) => {
        const [friend, lastMessage, unreadCount] = await Promise.all([
          prisma.user.findUnique({
            where: { id: friendId },
            select: {
              id: true,
              name: true,
              profile: { select: { username: true, displayName: true } },
            },
          }),
          prisma.message.findFirst({
            where: {
              OR: [
                { senderId: me.userId, receiverId: friendId },
                { senderId: friendId, receiverId: me.userId },
              ],
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.message.count({
            where: { senderId: friendId, receiverId: me.userId, readAt: null },
          }),
        ]);

        return { friend, lastMessage, unreadCount };
      })
    );

    conversations.sort((a, b) => {
      const at = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bt = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bt - at;
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("[messages:get] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/messages — send a direct message to a connected friend
export async function POST(req: NextRequest) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = sendSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message payload" }, { status: 400 });
    }

    const { receiverId, content } = parsed.data;
    if (receiverId === me.userId) {
      return NextResponse.json({ error: "You cannot message yourself" }, { status: 400 });
    }

    if (!(await areFriends(me.userId, receiverId))) {
      return NextResponse.json({ error: "You can only message connected fighters" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: { senderId: me.userId, receiverId, content },
    });

    sendPushToUser(receiverId, {
      title: me.name,
      body: content.length > 140 ? `${content.slice(0, 137)}...` : content,
      url: "/dashboard/community",
      tag: `message-${me.userId}`,
    }).catch(() => {});

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[messages:post] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
