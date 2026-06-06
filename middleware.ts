import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NOTE: Do NOT import jsonwebtoken here — middleware runs on Edge runtime
// which doesn't have full Node.js crypto support. JWT signature verification
// is handled by each API route handler via getAuthUser() (Node.js runtime).
const COOKIE_NAME = "fightlog_token";
const API_AUTH_PATHS = ["/api/auth/login", "/api/auth/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public API auth routes through unconditionally
  if (API_AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protect dashboard pages and all other API routes
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/");

  if (!isProtected) return NextResponse.next();

  // Only check cookie presence here — actual JWT verification happens in each
  // route handler via getAuthUser(), which runs in Node.js (not Edge).
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
