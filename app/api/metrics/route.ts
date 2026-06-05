import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const metrics = await prisma.physicalMetric.findMany({
    where: { userId: user.userId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(metrics);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const metric = await prisma.physicalMetric.create({
    data: { ...body, userId: user.userId, date: new Date(body.date) },
  });
  return NextResponse.json(metric, { status: 201 });
}
