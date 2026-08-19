import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { publicOrigin } from "@/lib/hosts";
import { sessionCookieOptions } from "@/lib/auth/session";
import type { LoginAudience } from "@/lib/auth/access";

function parseAudience(value: string | null): LoginAudience {
  if (value === "admin" || value === "console") return value;
  return "app";
}

function loginPath(audience: LoginAudience): string {
  if (audience === "admin") return "/admin/login";
  if (audience === "console") return "/console/login";
  return "/login";
}

function audienceFromRequest(request: Request, formAudience?: string | null): LoginAudience {
  if (formAudience) return parseAudience(formAudience);
  const url = new URL(request.url);
  const query = url.searchParams.get("audience") ?? url.searchParams.get("next");
  if (query === "admin" || query === "console" || query === "app") return query;
  const referer = request.headers.get("referer") ?? "";
  try {
    const path = new URL(referer).pathname;
    if (path.startsWith("/console")) return "console";
    if (path.startsWith("/admin")) return "admin";
  } catch {
    /* ignore */
  }
  if (url.searchParams.get("redirect")?.startsWith("/admin")) return "admin";
  if (url.searchParams.get("redirect")?.startsWith("/console")) return "console";
  return "app";
}

async function logoutAndRedirect(request: Request, audience: LoginAudience): Promise<Response> {
  const opts = sessionCookieOptions("", true, request.headers.get("host") ?? "");
  const dest = loginPath(audience);
  const response = NextResponse.redirect(new URL(dest, `${publicOrigin(request)}/`), 303);
  const cookieStore = await cookies();
  cookieStore.set(opts);
  response.cookies.set(opts);
  return response;
}

export async function GET(request: Request): Promise<Response> {
  return logoutAndRedirect(request, audienceFromRequest(request));
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  let formAudience: string | null = null;
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const fd = await request.formData();
    formAudience = String(fd.get("audience") ?? "") || null;
  }
  return logoutAndRedirect(request, audienceFromRequest(request, formAudience));
}
