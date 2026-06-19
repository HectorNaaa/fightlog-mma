import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

const actionSchema = z.object({
  action: z.enum(["accept", "reject", "cancel"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const parsed = actionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const friendRequest = await prisma.friendRequest.findUnique({ where: { id } });
    if (!friendRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (friendRequest.status !== "pending") {
      return NextResponse.json({ error: "Request already processed" }, { status: 409 });
    }

    const { action } = parsed.data;

    if (action === "cancel") {
      if (friendRequest.requesterId !== me.userId) {
        return NextResponse.json({ error: "Only sender can cancel this request" }, { status: 403 });
      }

      await prisma.friendRequest.update({
        where: { id },
        data: { status: "canceled" },
      });

      return NextResponse.json({ ok: true });
    }

    if (friendRequest.receiverId !== me.userId) {
      return NextResponse.json({ error: "Only receiver can process this request" }, { status: 403 });
    }

    if (action === "reject") {
      await prisma.friendRequest.update({
        where: { id },
        data: { status: "rejected" },
      });
      return NextResponse.json({ ok: true });
    }

    await prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: { id },
        data: { status: "accepted" },
      });

      await tx.friendship.createMany({
        data: [
          { userId: friendRequest.requesterId, friendId: friendRequest.receiverId },
          { userId: friendRequest.receiverId, friendId: friendRequest.requesterId },
        ],
        skipDuplicates: true,
      });

      await tx.activityEvent.createMany({
        data: [
          {
            userId: friendRequest.requesterId,
            eventType: "social.friend_request.accepted",
            message: "Your friend request was accepted",
            metadata: { byUserId: friendRequest.receiverId },
          },
          {
            userId: friendRequest.receiverId,
            eventType: "social.friend_request.accepted",
            message: "You accepted a friend request",
            metadata: { byUserId: friendRequest.requesterId },
          },
        ],
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[friends/requests:patch] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
