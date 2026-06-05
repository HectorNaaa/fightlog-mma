import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const techniques = await prisma.technique.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(techniques);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const technique = await prisma.technique.create({
    data: { ...body, userId: user.userId },
  });
  return NextResponse.json(technique, { status: 201 });
}
