import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

const actionSchema = z.object({
  action: z.enum(["join", "leave", "setPrimary"]),
});

// GET /api/gyms/[id] — gym profile with its member roster (affiliation directory)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const gym = await prisma.gym.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        city: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        description: true,
        createdAt: true,
        users: {
          select: {
            isPrimary: true,
            user: {
              select: {
                id: true,
                name: true,
                level: true,
                discipline: true,
                profile: { select: { username: true, displayName: true, beltRank: true } },
              },
            },
          },
        },
      },
    });

    if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 });

    const isMember = gym.users.some((u) => u.user.id === me.userId);

    return NextResponse.json({
      id: gym.id,
      name: gym.name,
      city: gym.city,
      postalCode: gym.postalCode,
      latitude: gym.latitude,
      longitude: gym.longitude,
      description: gym.description,
      isMember,
      members: gym.users.map((u) => ({
        id: u.user.id,
        name: u.user.name,
        level: u.user.level,
        discipline: u.user.discipline,
        isPrimary: u.isPrimary,
        profile: u.user.profile,
      })),
    });
  } catch (error) {
    console.error("[gyms/:id:get] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/gyms/[id] — join/leave the gym, or mark it as your primary affiliation
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

    const gym = await prisma.gym.findUnique({ where: { id } });
    if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 });

    const { action } = parsed.data;

    if (action === "leave") {
      await prisma.userGym.deleteMany({ where: { userId: me.userId, gymId: id } });
      return NextResponse.json({ ok: true });
    }

    if (action === "join") {
      await prisma.userGym.upsert({
        where: { userId_gymId: { userId: me.userId, gymId: id } },
        update: {},
        create: { userId: me.userId, gymId: id },
      });
      return NextResponse.json({ ok: true });
    }

    // setPrimary
    await prisma.$transaction([
      prisma.userGym.updateMany({ where: { userId: me.userId }, data: { isPrimary: false } }),
      prisma.userGym.upsert({
        where: { userId_gymId: { userId: me.userId, gymId: id } },
        update: { isPrimary: true },
        create: { userId: me.userId, gymId: id, isPrimary: true },
      }),
      prisma.user.update({ where: { id: me.userId }, data: { gymName: gym.name } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[gyms/:id:patch] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
