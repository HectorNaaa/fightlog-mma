import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  date: z.string().optional(),
  note: z.string().max(1000).optional().nullable(),
});

// Downloads the actual routine PDF/Excel bytes (documents only — media
// attachments have no server-side file data, they only ever live in the
// uploading device's IndexedDB).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.attachment.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== user.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!existing.fileData) {
    return NextResponse.json({ error: "No file stored for this attachment" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(existing.fileData), {
    headers: {
      "Content-Type": existing.fileType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(existing.fileName)}"`,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.attachment.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== user.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const attachment = await prisma.attachment.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json(attachment);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.attachment.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== user.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.attachment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
