import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

const requestSchema = z.object({
  receiverId: z.string().min(1),
  note: z.string().max(240).optional(),
});

export async function GET() {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [incoming, outgoing] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { receiverId: me.userId, status: "pending" },
        orderBy: { createdAt: "desc" },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              gymName: true,
              discipline: true,
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.friendRequest.findMany({
        where: { requesterId: me.userId, status: "pending" },
        orderBy: { createdAt: "desc" },
        include: {
          receiver: {
            select: {
              id: true,
              name: true,
              gymName: true,
              discipline: true,
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({ incoming, outgoing });
  } catch (error) {
    console.error("[friends/requests:get] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { receiverId, note } = parsed.data;

    if (receiverId === me.userId) {
      return NextResponse.json({ error: "You cannot send a request to yourself" }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true, name: true } });
    if (!receiver) return NextResponse.json({ error: "Fighter not found" }, { status: 404 });

    const [existingFriendship, outgoingRequest, incomingRequest] = await Promise.all([
      prisma.friendship.findUnique({ where: { userId_friendId: { userId: me.userId, friendId: receiverId } } }),
      prisma.friendRequest.findFirst({
        where: {
          requesterId: me.userId,
          receiverId,
        },
      }),
      prisma.friendRequest.findFirst({
        where: {
          requesterId: receiverId,
          receiverId: me.userId,
          status: "pending",
        },
      }),
    ]);

    if (existingFriendship) {
      return NextResponse.json({ error: "You are already connected" }, { status: 409 });
    }

    if (incomingRequest) {
      return NextResponse.json(
        { error: "This fighter already sent you a request", requestId: incomingRequest.id },
        { status: 409 }
      );
    }

    if (outgoingRequest?.status === "pending") {
      return NextResponse.json({ error: "A pending request already exists" }, { status: 409 });
    }

    const request = outgoingRequest
      ? await prisma.friendRequest.update({
          where: { id: outgoingRequest.id },
          data: {
            status: "pending",
            note,
          },
        })
      : await prisma.friendRequest.create({
          data: {
            requesterId: me.userId,
            receiverId,
            note,
          },
        });

    await prisma.activityEvent.create({
      data: {
        userId: me.userId,
        eventType: "social.friend_request.sent",
        message: `Sent a friend request to ${receiver.name}`,
        metadata: { receiverId },
      },
    });

    return NextResponse.json({ requestId: request.id, ok: true }, { status: 201 });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "A request already exists for this fighter" }, { status: 409 });
    }

    console.error("[friends/requests:post] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
