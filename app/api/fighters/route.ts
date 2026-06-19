import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const query = req.nextUrl.searchParams.get("q")?.trim() || "";
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 12), 30);

    const myFriends = await prisma.friendship.findMany({
      where: { userId: me.userId },
      select: { friendId: true },
    });
    const myFriendIds = myFriends.map((f) => f.friendId);

    const whereClause = {
      id: { not: me.userId },
      OR: query
        ? [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { profile: { username: { contains: query, mode: "insensitive" as const } } },
            { profile: { displayName: { contains: query, mode: "insensitive" as const } } },
          ]
        : undefined,
    };

    const users = await prisma.user.findMany({
      where: whereClause,
      take: limit,
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
            avatarUrl: true,
            city: true,
            beltRank: true,
            weightClass: true,
            bio: true,
            isPublic: true,
          },
        },
        userDisciplines: {
          select: {
            discipline: { select: { name: true } },
          },
        },
        userGyms: {
          select: {
            gym: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const [myDisciplines, myGyms] = await Promise.all([
      prisma.userDiscipline.findMany({
        where: { userId: me.userId },
        select: {
          discipline: { select: { name: true } },
        },
      }),
      prisma.userGym.findMany({
        where: { userId: me.userId },
        select: { gymId: true },
      }),
    ]);

    const myDisciplineNames = new Set(myDisciplines.map((d) => d.discipline.name));
    const myGymIds = new Set(myGyms.map((g) => g.gymId));

    const candidates = await Promise.all(
      users.map(async (user) => {
        const candidateFriendIds = await prisma.friendship.findMany({
          where: { userId: user.id },
          select: { friendId: true },
        });

        const candidateSet = new Set(candidateFriendIds.map((f) => f.friendId));
        const mutualFriends = myFriendIds.filter((id) => candidateSet.has(id)).length;

        const sharedDisciplines = user.userDisciplines
          .map((ud) => ud.discipline.name)
          .filter((name) => myDisciplineNames.has(name));

        const sharedGyms = user.userGyms
          .filter((ug) => myGymIds.has(ug.gym.id))
          .map((ug) => ug.gym.name);

        const isFriend = myFriendIds.includes(user.id);

        return {
          id: user.id,
          isFriend,
          name: user.name,
          level: user.level,
          gymName: user.gymName,
          primaryDiscipline: user.discipline,
          profile: user.profile,
          disciplines: user.userDisciplines.map((ud) => ud.discipline.name),
          mutualFriends,
          sharedDisciplines,
          sharedGyms,
        };
      })
    );

    return NextResponse.json(candidates);
  } catch (error) {
    console.error("[fighters/search] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
