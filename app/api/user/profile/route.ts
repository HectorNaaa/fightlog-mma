import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  todayFocus: z.string().max(200).optional().nullable(),
  gymName: z.string().max(80).optional().nullable(),
});

// PUT /api/user/profile — update profile fields
export async function PUT(req: NextRequest) {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: me.userId },
    data: parsed.data,
    select: { id: true, name: true, gymName: true, todayFocus: true, level: true },
  });

  return NextResponse.json(updated);
}
