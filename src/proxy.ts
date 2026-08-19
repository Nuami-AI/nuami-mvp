// Host split: app.nuami.kr / admin.nuami.kr / console.nuami.kr
// Local: all products share one origin via / , /admin/{slug} , /console
import { type NextRequest, NextResponse } from "next/server";

import { COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { isNuamiOperator } from "@/lib/auth/roles";
import { isSuperAdmin } from "@/lib/auth/access";
import {
  hostKind,
  isAppOnlyPath,
  isConsolePath,
  originFor,
  productHost,
} from "@/lib/hosts";

export const config = {
  matcher: [
    "/",
    "/login",
    "/login/:path*",
    "/signup",
    "/signup/:path*",
    "/content/:path*",
    "/mypage/:path*",
    "/password",
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
  const hostHeader = request.headers.get("host") ?? "";
  const kind = hostKind(hostHeader);
  const appHost = productHost("app", hostHeader);
  const adminHost = productHost("admin", hostHeader);
  const consoleHost = productHost("console", hostHeader);
  const { pathname } = request.nextUrl;

  // Host split must run before auth. Otherwise admin.nuami.kr/ and
  // console.nuami.kr/ look like the student app (pathname is still "/").
  if (kind === "admin") {
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/login" ? "/admin/login" : `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }
    if (pathname === "/" || pathname === "") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }
    if (isConsolePath(pathname) && consoleHost) {
      return NextResponse.redirect(`${originFor(consoleHost, request.url)}${pathname}${request.nextUrl.search}`);
    }
    if (isAppOnlyPath(pathname) || isConsolePath(pathname)) {
      if (appHost && isAppOnlyPath(pathname)) {
        return NextResponse.redirect(`${originFor(appHost, request.url)}${pathname}${request.nextUrl.search}`);
      }
      const adminHome = request.nextUrl.clone();
      adminHome.pathname = "/admin";
      return NextResponse.redirect(adminHome);
    }
    if (pathname !== "/admin" && !pathname.startsWith("/admin/")) {
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  if (kind === "console") {
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/login" ? "/console/login" : `/console${pathname}`;
      return NextResponse.rewrite(url);
    }
    if (pathname === "/" || pathname === "") {
      const url = request.nextUrl.clone();
      url.pathname = "/console";
      return NextResponse.rewrite(url);
    }
    if (isAppOnlyPath(pathname) || pathname.startsWith("/admin")) {
      const consoleHome = request.nextUrl.clone();
      consoleHome.pathname = "/console";
      return NextResponse.redirect(consoleHome);
    }
  }

  if (kind === "app" && isConsolePath(pathname) && consoleHost) {
    return NextResponse.redirect(`${originFor(consoleHost, request.url)}${pathname}${request.nextUrl.search}`);
  }

  if (kind === "app" && pathname.startsWith("/admin") && adminHost) {
    const destPath = pathname === "/admin" ? "/" : pathname.replace(/^\/admin/, "") || "/";
    return NextResponse.redirect(`${originFor(adminHost, request.url)}${destPath}${request.nextUrl.search}`);
  }

  const isPublicLogin =
    pathname === "/admin/login" ||
    pathname === "/admin/join" ||
    pathname === "/console/login" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/login/");

  if (isPublicLogin) {
    return NextResponse.next();
  }

  const passwordChangePaths = new Set(["/admin/password", "/console/password", "/password"]);

  if (passwordChangePaths.has(pathname)) {
    const sessionCookie = request.cookies.get(COOKIE_NAME);
    if (!sessionCookie?.value) return redirectToLogin(request, kind);
    try {
      await verifySession(sessionCookie.value);
    } catch {
      return redirectToLogin(request, kind);
    }
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    return redirectToLogin(request, kind);
  }

  let payload;
  try {
    payload = await verifySession(sessionCookie.value);
  } catch {
    return redirectToLogin(request, kind);
  }

  if (isConsolePath(pathname) && !isNuamiOperator(payload.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (kind === "console" && !isNuamiOperator(payload.role)) {
    if (appHost) {
      return NextResponse.redirect(originFor(appHost, request.url) + "/");
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (payload.mustChangePassword && !passwordChangePaths.has(pathname)) {
    const dest =
      kind === "console" || isConsolePath(pathname)
        ? "/console/password"
        : kind === "admin" || pathname.startsWith("/admin")
          ? "/admin/password"
          : "/password";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (
    isNuamiOperator(payload.role) &&
    !isSuperAdmin(payload.email) &&
    (pathname === "/admin" ||
      (pathname.startsWith("/admin/") &&
        pathname !== "/admin/login" &&
        pathname !== "/admin/denied" &&
        pathname !== "/admin/join" &&
        pathname !== "/admin/password"))
  ) {
    return NextResponse.redirect(new URL("/console/organizations", request.url));
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest, kind: ReturnType<typeof hostKind>) {
  const { pathname, search } = request.nextUrl;
  const loginPath =
    kind === "console" || pathname.startsWith("/console")
      ? "/console/login"
      : kind === "admin" || pathname.startsWith("/admin")
        ? "/admin/login"
        : "/login";
  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set("redirect", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}
