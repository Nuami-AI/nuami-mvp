// Design Ref: §6 — proxy.ts (Next.js 16 renamed from middleware.ts), jose-only
// Plan SC: FR-02 — protect /video-ai and /admin routes
import { type NextRequest, NextResponse } from "next/server";

import { COOKIE_NAME, verifySession } from "@/lib/auth/session";

export const config = {
  matcher: [
    "/",
    "/content/:path*",
    "/mypage/:path*",
    "/guide/:path*",
    "/video-ai/:path*",
    "/admin/:path*",
  ],
};

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    return redirectToLogin(request);
  }

  let payload;
  try {
    payload = await verifySession(sessionCookie.value);
  } catch {
    return redirectToLogin(request);
  }

  // /admin requires admin role
  if (request.nextUrl.pathname.startsWith("/admin") && payload.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
