import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken, createAuthCookie } from "@/lib/auth";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  level: z.enum(["beginner", "intermediate"]),
  discipline: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, level, discipline } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, level, discipline },
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
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
