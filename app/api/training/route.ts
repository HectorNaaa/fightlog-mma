import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

const sessionSchema = z.object({
  date: z.string(),
  type: z.string(),
  duration: z.number().int().min(1),
  intensity: z.number().int().min(1).max(10),
  energyBefore: z.number().int().min(1).max(10),
  energyAfter: z.number().int().min(1).max(10),
  soreness: z.number().int().min(1).max(10),
  bodyWeight: z.number().optional().nullable(),
  mood: z.string().optional().nullable(),
  mainFocus: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  coachFeedback: z.string().optional().nullable(),
  personalRating: z.number().int().min(1).max(10).optional().nullable(),
  physicalState: z.number().int().min(1).max(5).optional().nullable(),
  dailyFocus: z.string().max(200).optional().nullable(),
  tacticNote: z.string().max(500).optional().nullable(),
  tacticPublic: z.boolean().optional(),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.trainingSession.findMany({
    where: { userId: user.userId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const session = await prisma.trainingSession.create({
    data: { ...parsed.data, userId: user.userId, date: new Date(parsed.data.date) },
  });
  return NextResponse.json(session, { status: 201 });
}
