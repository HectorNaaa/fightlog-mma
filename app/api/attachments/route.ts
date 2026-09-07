import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

// Routine files (PDF/Excel) ARE stored server-side (small, need to be
// available on every device). Media (photos/videos) stay device-local —
// only their tiny metadata (name/type/size/date/note/device label) is
// stored here; the actual bytes never leave the uploading browser (see
// components/files/local-attachments.tsx + lib/local-files.ts).
const sectionEnum = z.enum(["training", "social", "technical", "performance", "account"]);

const mediaSchema = z.object({
  section: sectionEnum,
  kind: z.literal("media"),
  fileName: z.string().min(1).max(200),
  fileType: z.string().max(100),
  fileSize: z.number().int().min(0).max(2_000_000_000),
  date: z.string(),
  note: z.string().max(1000).optional().nullable(),
  deviceId: z.string().min(1).max(100),
  deviceName: z.string().min(1).max(100),
});

const docFieldsSchema = z.object({
  section: sectionEnum,
  date: z.string(),
  note: z.string().max(1000).optional(),
  deviceId: z.string().min(1).max(100),
  deviceName: z.string().min(1).max(100),
});

const ALLOWED_DOC_MIME = new Set([
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const ALLOWED_DOC_EXT = [".pdf", ".xls", ".xlsx"];
const MAX_DOC_BYTES = 15 * 1024 * 1024;

function isAllowedDocFile(file: File): boolean {
  if (ALLOWED_DOC_MIME.has(file.type)) return true;
  const lower = file.name.toLowerCase();
  return ALLOWED_DOC_EXT.some((ext) => lower.endsWith(ext));
}

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
  // Never send the actual file bytes down with the list — just whether a
  // server copy exists (documents only; media is always device-local).
  const result = attachments.map(({ fileData, ...rest }) => ({ ...rest, hasFile: fileData != null }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!isAllowedDocFile(file)) {
      return NextResponse.json({ error: "Only PDF or Excel files are allowed" }, { status: 400 });
    }
    if (file.size > MAX_DOC_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }
    const parsed = docFieldsSchema.safeParse({
      section: form.get("section"),
      date: form.get("date"),
      note: form.get("note") || undefined,
      deviceId: form.get("deviceId"),
      deviceName: form.get("deviceName"),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const attachment = await prisma.attachment.create({
      data: {
        ...parsed.data,
        kind: "document",
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: buffer.byteLength,
        fileData: buffer,
        userId: user.userId,
      },
    });
    const { id, section: savedSection, kind, fileName, fileType, fileSize, date, note, deviceId, deviceName, createdAt, updatedAt } = attachment;
    return NextResponse.json(
      { id, section: savedSection, kind, fileName, fileType, fileSize, date, note, deviceId, deviceName, createdAt, updatedAt, hasFile: true },
      { status: 201 }
    );
  }

  const body = await req.json();
  const parsed = mediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const attachment = await prisma.attachment.create({
    data: { ...parsed.data, userId: user.userId },
  });
  return NextResponse.json({ ...attachment, hasFile: false }, { status: 201 });
}

