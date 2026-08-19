// Host split: app.nuami.kr / admin.nuami.kr / console.nuami.kr
// Local: all products share one origin via / , /admin/{slug} , /console
import { type NextRequest, NextResponse } from "next/server";

import { COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { isNuamiOperator } from "@/lib/auth/roles";
import {
  ADMIN_HOST,
  APP_HOST,
  CONSOLE_HOST,
  hostKind,
  isAppOnlyPath,
  isConsolePath,
  originFor,
} from "@/lib/hosts";

export const config = {
  matcher: [
    "/",
    "/content/:path*",
    "/mypage/:path*",
    "/history",
    "/saved/:path*",
    "/guide/:path*",
    "/campus",
    "/campus/:path*",
    "/video-ai/:path*",
    "/admin",
    "/admin/:path*",
    "/console",
    "/console/:path*",
  ],
};

export async function proxy(request: NextRequest) {
  const kind = hostKind(request.headers.get("host") ?? "");
  const { pathname } = request.nextUrl;

  const isPublicLogin =
    pathname === "/admin/login" ||
    pathname === "/admin/join" ||
    pathname === "/console/login" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/login/");

  if (kind === "admin" && (isAppOnlyPath(pathname) || isConsolePath(pathname)) && pathname !== "/") {
    if (APP_HOST && isAppOnlyPath(pathname)) {
      return NextResponse.redirect(`${originFor(APP_HOST, request.url)}${pathname}${request.nextUrl.search}`);
    }
    const adminHome = request.nextUrl.clone();
    adminHome.pathname = "/admin";
    return NextResponse.redirect(adminHome);
  }

  if (kind === "console" && (isAppOnlyPath(pathname) || pathname.startsWith("/admin")) && pathname !== "/") {
    const consoleHome = request.nextUrl.clone();
    consoleHome.pathname = "/console";
    return NextResponse.redirect(consoleHome);
  }

  if (kind === "app" && isConsolePath(pathname) && CONSOLE_HOST) {
    return NextResponse.redirect(`${originFor(CONSOLE_HOST, request.url)}${pathname}${request.nextUrl.search}`);
  }

  if (kind === "app" && pathname.startsWith("/admin") && ADMIN_HOST) {
    const destPath = pathname === "/admin" ? "/" : pathname.replace(/^\/admin/, "") || "/";
    return NextResponse.redirect(`${originFor(ADMIN_HOST, request.url)}${destPath}${request.nextUrl.search}`);
  }

  if (isPublicLogin) {
    return NextResponse.next();
  }

  if (pathname === "/admin/password") {
    const sessionCookie = request.cookies.get(COOKIE_NAME);
    if (!sessionCookie?.value) return redirectToLogin(request);
    try {
      await verifySession(sessionCookie.value);
    } catch {
      return redirectToLogin(request);
    }
    return NextResponse.next();
  }

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

  if (isConsolePath(pathname) && !isNuamiOperator(payload.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (kind === "console" && !isNuamiOperator(payload.role)) {
    if (APP_HOST) {
      return NextResponse.redirect(originFor(APP_HOST, request.url) + "/");
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (payload.mustChangePassword && pathname !== "/admin/password") {
    return NextResponse.redirect(new URL("/admin/password", request.url));
  }

  if (isNuamiOperator(payload.role) && (pathname === "/admin" || (pathname.startsWith("/admin/") && pathname !== "/admin/login" && pathname !== "/admin/denied" && pathname !== "/admin/join" && pathname !== "/admin/password"))) {
    return NextResponse.redirect(new URL("/console/organizations", request.url));
  }

  if (kind === "admin" && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.rewrite(url);
  }

  if (kind === "console" && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/console";
    return NextResponse.rewrite(url);
  }

  if (kind === "admin" && pathname !== "/admin" && !pathname.startsWith("/admin/")) {
    const slugPath = pathname === "/" ? "/admin" : `/admin${pathname}`;
    const url = request.nextUrl.clone();
    url.pathname = slugPath;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const loginPath = pathname.startsWith("/console")
    ? "/console/login"
    : pathname.startsWith("/admin")
      ? "/admin/login"
      : "/login";
  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set("redirect", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}
