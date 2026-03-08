import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { updateSession } from "@/lib/supabase/middleware";

function rateLimitKey(pathname: string, method: string): "photo-upload" | "beta-apply" | "request" | "search" | "api" | null {
  if (!pathname.startsWith("/api/")) return null;
  if (method === "POST" && /^\/api\/host\/listings\/[^/]+\/photos$/.test(pathname)) return "photo-upload";
  if (method === "POST" && pathname === "/api/beta/apply") return "beta-apply";
  if (method === "POST" && (pathname === "/api/booking-requests" || pathname === "/api/storage-requests")) return "request";
  if (method === "GET" && (pathname === "/api/search" || pathname === "/api/storage/search")) return "search";
  if (pathname.startsWith("/api/")) return "api";
  return null;
}

export async function proxy(request: NextRequest) {
  const key = rateLimitKey(request.nextUrl.pathname, request.method);
  if (key) {
    const id = getClientIdentifier(request);
    const result = await checkRateLimit(id, key);
    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
