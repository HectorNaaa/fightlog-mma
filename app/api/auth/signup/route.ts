import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken, createAuthCookie, AuthConfigError } from "@/lib/auth";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  level: z.enum(["beginner", "intermediate"]),
  discipline: z.string().min(1),
});

function slugifyUsername(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
  return base || "fighter";
}

async function createUniqueUsername(baseName: string): Promise<string> {
  const base = slugifyUsername(baseName);
  let candidate = base;
  let i = 1;

  while (await prisma.profile.findUnique({ where: { username: candidate } })) {
    candidate = `${base}${i}`;
    i += 1;
  }

  return candidate;
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please complete all required fields with valid values", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, password, level, discipline } = parsed.data;
    const email = parsed.data.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const username = await createUniqueUsername(name);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { name, email, password: hashedPassword, level, discipline },
      });

      await tx.profile.create({
        data: {
          userId: createdUser.id,
          username,
          displayName: name,
          visibility: "private",
          isPublic: false,
        },
      });

      const disciplineRecord = await tx.discipline.upsert({
        where: { name: discipline },
        update: {},
        create: { name: discipline },
      });

      await tx.userDiscipline.create({
        data: {
          userId: createdUser.id,
          disciplineId: disciplineRecord.id,
        },
      });

      await tx.activityEvent.create({
        data: {
          userId: createdUser.id,
          eventType: "onboarding.profile.created",
          message: "Built by fighters, for fighters.",
          metadata: { username },
        },
      });

      return createdUser;
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      level: user.level,
    });

    const cookieOptions = createAuthCookie(token);
    const response = NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email, level: user.level } },
      { status: 201 }
    );
    response.cookies.set(cookieOptions);
    return response;
  } catch (err) {
    if (err instanceof AuthConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("[auth/signup] Internal error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
