import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const gameplans = await prisma.gameplan.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(gameplans);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const gameplan = await prisma.gameplan.create({ data: { ...body, userId: user.userId } });
  return NextResponse.json(gameplan, { status: 201 });
}
