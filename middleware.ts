import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NOTE: Do NOT import jsonwebtoken here — middleware runs on Edge runtime
// which doesn't have full Node.js crypto support. JWT signature verification
// is handled by each API route handler via getAuthUser() (Node.js runtime).
const COOKIE_NAME = "fightlog_token";
const API_AUTH_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/me",
  "/api/auth/logout",
];
const AUTH_PAGES = ["/auth/login", "/auth/signup"];

// --- Abuse / cost-spike protection -----------------------------------------
// Best-effort in-memory rate limiting + request-size guard for /api/*. This
// runs on the Edge runtime and the counters live per-instance (not shared
// across Vercel's edge regions/instances), so it isn't a perfect global
// limiter — but it stops the common case of a single client/script hammering
// the API (brute-forcing login, spamming write endpoints, etc.) and does so
// for free, without needing a paid external store (Redis/Upstash). It's a
// meaningful first line of defense against runaway function-invocation /
// database costs from automated abuse, layered on top of Vercel's own
// platform-level DDoS protection.
type Bucket = { count: number; resetAt: number };
const rateLimitStore = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 5000;

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function checkRateLimit(key: string, limit: number, windowMs: number): { limited: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    // Prevent unbounded memory growth if an attacker rotates IPs/paths.
    if (rateLimitStore.size > MAX_TRACKED_KEYS) {
      rateLimitStore.forEach((v, k) => {
        if (v.resetAt <= now) rateLimitStore.delete(k);
      });
    }
    return { limited: false, retryAfterSec: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { limited: true, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { limited: false, retryAfterSec: 0 };
}

// No route in this app accepts large file uploads except the routine
// PDF/Excel attachment upload (small documents only, media stays device-
// local) — every other API body is small JSON, so a generous-but-finite
// cap blocks large-payload flood attempts without risking legitimate
// requests.
const MAX_BODY_BYTES = 500_000;
const MAX_ATTACHMENT_UPLOAD_BYTES = 16 * 1024 * 1024;

function tooLarge(request: NextRequest): boolean {
  if (!["POST", "PUT", "PATCH"].includes(request.method)) return false;
  const len = request.headers.get("content-length");
  if (!len) return false;
  const bytes = Number(len);
  if (!Number.isFinite(bytes)) return false;
  const limit =
    request.method === "POST" && request.nextUrl.pathname === "/api/attachments"
      ? MAX_ATTACHMENT_UPLOAD_BYTES
      : MAX_BODY_BYTES;
  return bytes > limit;
}
// ----------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (pathname.startsWith("/api/")) {
    if (tooLarge(request)) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const ip = getClientIp(request);
    const isAuthEndpoint = pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/signup");
    // Stricter window on login/signup slows down credential-stuffing/brute-force
    // attempts; a looser general limit still catches runaway scripted abuse.
    const { limited, retryAfterSec } = isAuthEndpoint
      ? checkRateLimit(`auth:${ip}`, 20, 5 * 60 * 1000)
      : checkRateLimit(`api:${ip}`, 120, 60 * 1000);

    if (limited) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }
  }

  // Logged-in users shouldn't revisit login/signup pages.
  if (AUTH_PAGES.some((p) => pathname.startsWith(p)) && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow public API auth routes through unconditionally
  if (API_AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Vercel Cron requests never carry the user's session cookie — the route
  // itself verifies the `Authorization: Bearer CRON_SECRET` header, so it
  // must not be blocked here or scheduled jobs (e.g. daily reminders) 401
  // before ever reaching the handler.
  if (pathname.startsWith("/api/cron/")) {
    return NextResponse.next();
  }

  // Protect dashboard pages and all other API routes
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/");

  if (!isProtected) return NextResponse.next();

  // Only check cookie presence here — actual JWT verification happens in each
  // route handler via getAuthUser(), which runs in Node.js (not Edge).
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
  matcher: ["/dashboard/:path*", "/api/:path*", "/auth/:path*"],
};
