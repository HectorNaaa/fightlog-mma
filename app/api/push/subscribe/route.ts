import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

// POST /api/push/subscribe — register a browser/device push subscription
export async function POST(req: NextRequest) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = subscribeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    const { endpoint, keys } = parsed.data;
    const userAgent = req.headers.get("user-agent")?.slice(0, 300) ?? null;

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: me.userId, p256dh: keys.p256dh, auth: keys.auth, userAgent },
      create: { userId: me.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[push/subscribe:post] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/push/subscribe — remove a push subscription (e.g. on unsubscribe/logout)
export async function DELETE(req: NextRequest) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : null;
    if (!endpoint) return NextResponse.json({ error: "Endpoint required" }, { status: 400 });

    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: me.userId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[push/subscribe:delete] Internal error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
