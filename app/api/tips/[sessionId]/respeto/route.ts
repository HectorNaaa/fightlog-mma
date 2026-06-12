import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// POST /api/tips/[sessionId]/respeto — toggle respeto on a tip
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;

  const existing = await prisma.tacticRespeto.findUnique({
    where: { userId_sessionId: { userId: me.userId, sessionId } },
  });

  if (existing) {
    await prisma.tacticRespeto.delete({ where: { id: existing.id } });
    return NextResponse.json({ respeto: false });
  } else {
    await prisma.tacticRespeto.create({ data: { userId: me.userId, sessionId } });
    return NextResponse.json({ respeto: true });
  }
}
