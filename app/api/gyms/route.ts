import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { geocodePostalCode } from "@/lib/geocode";

const createGymSchema = z.object({
  name: z.string().min(2).max(100),
  city: z.string().max(80).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  countryCode: z.string().length(2).optional(),
  description: z.string().max(600).optional().nullable(),
});

// GET /api/gyms — directory of gyms with member counts (optional ?q= search)
export async function GET(req: NextRequest) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const query = req.nextUrl.searchParams.get("q")?.trim();

    const gyms = await prisma.gym.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { city: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        city: true,
        postalCode: true,
        description: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    return NextResponse.json(
      gyms.map((gym) => ({
        id: gym.id,
        name: gym.name,
        city: gym.city,
        postalCode: gym.postalCode,
        description: gym.description,
        memberCount: gym._count.users,
      }))
    );
  } catch (error) {
    console.error("[gyms:get] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/gyms — create a new gym and join it as the primary gym
export async function POST(req: NextRequest) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = createGymSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid gym payload" }, { status: 400 });
    }

    const { name, city, postalCode, countryCode, description } = parsed.data;

    const existing = await prisma.gym.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "A gym with this name already exists" }, { status: 409 });
    }

    let geocoded: { latitude: number; longitude: number } | null = null;
    if (postalCode && postalCode.trim()) {
      geocoded = await geocodePostalCode(postalCode, countryCode);
    }

    const gym = await prisma.gym.create({
      data: {
        name,
        city,
        postalCode,
        description,
        latitude: geocoded?.latitude,
        longitude: geocoded?.longitude,
      },
    });

    await prisma.userGym.upsert({
      where: { userId_gymId: { userId: me.userId, gymId: gym.id } },
      update: { isPrimary: true },
      create: { userId: me.userId, gymId: gym.id, isPrimary: true },
    });

    return NextResponse.json(gym, { status: 201 });
  } catch (error) {
    console.error("[gyms:post] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
