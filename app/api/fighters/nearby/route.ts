import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { haversineDistanceKm } from "@/lib/geo";

const DEFAULT_RADIUS_KM = 100;
const MAX_RADIUS_KM = 500;

// GET /api/fighters/nearby — fighters and gyms near the current user's postal code
export async function GET(req: NextRequest) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const myProfile = await prisma.profile.findUnique({
      where: { userId: me.userId },
      select: { latitude: true, longitude: true, postalCode: true, city: true },
    });

    if (!myProfile || myProfile.latitude == null || myProfile.longitude == null) {
      return NextResponse.json({ needsLocation: true, fighters: [], gyms: [] });
    }

    const radiusParam = Number(req.nextUrl.searchParams.get("radiusKm"));
    const radiusKm = Number.isFinite(radiusParam) && radiusParam > 0
      ? Math.min(radiusParam, MAX_RADIUS_KM)
      : DEFAULT_RADIUS_KM;

    const myFriends = await prisma.friendship.findMany({
      where: { userId: me.userId },
      select: { friendId: true },
    });
    const myFriendIds = new Set(myFriends.map((f) => f.friendId));

    const [candidates, gyms] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: { not: me.userId },
          profile: { latitude: { not: null }, longitude: { not: null } },
        },
        select: {
          id: true,
          name: true,
          level: true,
          gymName: true,
          discipline: true,
          profile: {
            select: {
              username: true,
              displayName: true,
              city: true,
              beltRank: true,
              latitude: true,
              longitude: true,
              isPublic: true,
            },
          },
        },
        take: 300,
      }),
      prisma.gym.findMany({
        where: { latitude: { not: null }, longitude: { not: null } },
        select: { id: true, name: true, city: true, latitude: true, longitude: true },
      }),
    ]);

    const centerLat = myProfile.latitude;
    const centerLon = myProfile.longitude;

    const fighters = candidates
      .map((candidate) => {
        const lat = candidate.profile?.latitude;
        const lon = candidate.profile?.longitude;
        if (lat == null || lon == null) return null;
        const distanceKm = haversineDistanceKm(centerLat, centerLon, lat, lon);
        return {
          id: candidate.id,
          name: candidate.name,
          level: candidate.level,
          gymName: candidate.gymName,
          primaryDiscipline: candidate.discipline,
          profile: candidate.profile,
          latitude: lat,
          longitude: lon,
          isFriend: myFriendIds.has(candidate.id),
          distanceKm: Math.round(distanceKm * 10) / 10,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null && c.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 50);

    const nearbyGyms = gyms
      .map((gym) => {
        if (gym.latitude == null || gym.longitude == null) return null;
        const distanceKm = haversineDistanceKm(centerLat, centerLon, gym.latitude, gym.longitude);
        return { ...gym, distanceKm: Math.round(distanceKm * 10) / 10 };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null && g.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 30);

    return NextResponse.json({
      needsLocation: false,
      center: { latitude: centerLat, longitude: centerLon, city: myProfile.city, postalCode: myProfile.postalCode },
      radiusKm,
      fighters,
      gyms: nearbyGyms,
    });
  } catch (error) {
    console.error("[fighters/nearby] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
