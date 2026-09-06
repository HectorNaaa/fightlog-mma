import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

// NOTE: this route only ever stores file METADATA (name/type/size/date/note/
// device label). The actual file bytes are never sent here — they stay in
// the browser's IndexedDB on the device that uploaded them — so this table
// stays tiny and costs no Vercel storage regardless of how many files users
// attach.
const sectionEnum = z.enum(["training", "social", "technical", "performance", "account"]);
const kindEnum = z.enum(["document", "media"]);

const createSchema = z.object({
  section: sectionEnum,
  kind: kindEnum,
  fileName: z.string().min(1).max(200),
  fileType: z.string().max(100),
  fileSize: z.number().int().min(0).max(10_000_000_000),
  date: z.string(),
  note: z.string().max(1000).optional().nullable(),
  deviceId: z.string().min(1).max(100),
  deviceName: z.string().min(1).max(100),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sectionParam = req.nextUrl.searchParams.get("section");
  const parsedSection = sectionEnum.safeParse(sectionParam);

  const attachments = await prisma.attachment.findMany({
    where: {
      userId: user.userId,
      ...(parsedSection.success ? { section: parsedSection.data } : {}),
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(attachments);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const attachment = await prisma.attachment.create({
    data: { ...parsed.data, userId: user.userId },
  });
  return NextResponse.json(attachment, { status: 201 });
}
