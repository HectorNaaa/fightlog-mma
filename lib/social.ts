import { prisma } from "@/lib/db";

export type Visibility = "private" | "friends" | "public";

export async function getFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: { userId },
    select: { friendId: true },
  });

  return friendships.map((f) => f.friendId);
}

export async function areFriends(userId: string, otherUserId: string): Promise<boolean> {
  const friendship = await prisma.friendship.findUnique({
    where: {
      userId_friendId: {
        userId,
        friendId: otherUserId,
      },
    },
    select: { id: true },
  });

  return Boolean(friendship);
}

export function canViewByVisibility(args: {
  ownerId: string;
  viewerId: string;
  visibility: Visibility;
  isFriend: boolean;
}): boolean {
  const { ownerId, viewerId, visibility, isFriend } = args;

  if (ownerId === viewerId) return true;
  if (visibility === "public") return true;
  if (visibility === "friends") return isFriend;
  return false;
}
