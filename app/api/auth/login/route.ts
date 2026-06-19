import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signToken, createAuthCookie, AuthConfigError } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Please provide a valid email and password" }, { status: 400 });
    }

    const { password } = parsed.data;
    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      level: user.level,
    });

    const cookieOptions = createAuthCookie(token);
    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, level: user.level },
    });
    response.cookies.set(cookieOptions);
    return response;
  } catch (err) {
    if (err instanceof AuthConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2021" || err.code === "P2022") {
        console.error("[auth/login] Database schema mismatch", err);
        return NextResponse.json(
          { error: "Server database is updating. Please try again in a moment." },
          { status: 503 }
        );
      }
    }
    console.error("[auth/login] Internal error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
