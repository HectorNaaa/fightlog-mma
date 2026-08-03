import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { geocodePostalCode } from "@/lib/geocode";
import { z } from "zod";

const updateSchema = z.object({
  todayFocus: z.string().max(200).optional().nullable(),
  gymName: z.string().max(80).optional().nullable(),
  displayName: z.string().min(2).max(80).optional(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  beltRank: z.string().max(60).optional().nullable(),
  weightClass: z.string().max(60).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  countryCode: z.string().length(2).optional(),
  bio: z.string().max(600).optional().nullable(),
  isPublic: z.boolean().optional(),
  visibility: z.enum(["private", "friends", "public"]).optional(),
  disciplines: z.array(z.string().min(1).max(60)).max(12).optional(),
});

export async function GET() {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: me.userId },
    select: {
      id: true,
      name: true,
      email: true,
      level: true,
      gymName: true,
      discipline: true,
      todayFocus: true,
      profile: {
        select: {
          username: true,
          displayName: true,
          avatarUrl: true,
          beltRank: true,
          weightClass: true,
          city: true,
          postalCode: true,
          latitude: true,
          longitude: true,
          bio: true,
          isPublic: true,
          visibility: true,
        },
      },
      userDisciplines: {
        select: {
          discipline: { select: { name: true } },
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...profile,
    disciplines: profile.userDisciplines.map((d) => d.discipline.name),
  });
}

// PUT /api/user/profile — update profile fields
export async function PUT(req: NextRequest) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { disciplines, countryCode, ...rest } = parsed.data;

    // Geocode outside the transaction (network call) so we never hold a DB
    // transaction open while waiting on a third-party API. Best-effort: if it
    // fails, we just keep whatever coordinates already existed.
    let geocoded: { latitude: number; longitude: number } | null = null;
    if (typeof rest.postalCode === "string" && rest.postalCode.trim()) {
      geocoded = await geocodePostalCode(rest.postalCode, countryCode);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const userUpdate = await tx.user.update({
        where: { id: me.userId },
        data: {
          todayFocus: rest.todayFocus,
          gymName: rest.gymName,
          name: rest.displayName,
        },
        select: { id: true, name: true, gymName: true, todayFocus: true, level: true },
      });

      await tx.profile.upsert({
        where: { userId: me.userId },
        update: {
          displayName: rest.displayName,
          avatarUrl: rest.avatarUrl,
          beltRank: rest.beltRank,
          weightClass: rest.weightClass,
          city: rest.city,
          bio: rest.bio,
          isPublic: rest.isPublic,
          visibility: rest.visibility,
          ...(rest.postalCode !== undefined ? { postalCode: rest.postalCode } : {}),
          ...(geocoded ? { latitude: geocoded.latitude, longitude: geocoded.longitude } : {}),
        },
        create: {
          userId: me.userId,
          username: `fighter-${me.userId.slice(0, 8)}`,
          displayName: rest.displayName || userUpdate.name,
          avatarUrl: rest.avatarUrl,
          beltRank: rest.beltRank,
          weightClass: rest.weightClass,
          city: rest.city,
          bio: rest.bio,
          isPublic: rest.isPublic ?? false,
          visibility: rest.visibility ?? "private",
          postalCode: rest.postalCode ?? undefined,
          latitude: geocoded?.latitude,
          longitude: geocoded?.longitude,
        },
      });

      if (disciplines) {
        const deduped = Array.from(
          new Set(disciplines.map((d) => d.trim()).filter(Boolean))
        );

        const disciplineRecords = await Promise.all(
          deduped.map((name) =>
            tx.discipline.upsert({
              where: { name },
              update: {},
              create: { name },
            })
          )
        );

        await tx.userDiscipline.deleteMany({ where: { userId: me.userId } });
        if (disciplineRecords.length > 0) {
          await tx.userDiscipline.createMany({
            data: disciplineRecords.map((d) => ({
              userId: me.userId,
              disciplineId: d.id,
            })),
          });
        }
      }

      return userUpdate;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[user/profile:update] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
