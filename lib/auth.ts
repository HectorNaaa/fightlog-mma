import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_NAME = "fightlog_token";

class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConfigError";
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    // Intentionally avoid logging secret values.
    console.error("[auth] JWT_SECRET is missing or too short. Set a strong JWT_SECRET (min 32 chars).");
    throw new AuthConfigError("Authentication is not configured on this environment.");
  }
  return secret;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  level: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "30d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function createAuthCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  };
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
export { AuthConfigError };
