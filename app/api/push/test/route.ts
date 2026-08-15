import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push-server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/push/test — sends an immediate test push notification to every
// device the logged-in user has subscribed on. Lets the user verify push
// actually works without waiting for the daily reminder cron.
export async function POST() {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await prisma.pushSubscription.count({ where: { userId: me.userId } });
  if (count === 0) {
    return NextResponse.json({ error: "No push subscription found for this device" }, { status: 400 });
  }

  await sendPushToUser(me.userId, {
    title: "FightLog",
    body: "Push notifications are working correctly.",
    url: "/dashboard",
    tag: "test-notification",
  });

  return NextResponse.json({ ok: true });
}
