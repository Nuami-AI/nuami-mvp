import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { loginAccount } from "@/lib/auth/accounts";
import { canAccessInstitutionAdmin, isInternalAccount, type LoginAudience } from "@/lib/auth/access";
import { publicOrigin } from "@/lib/hosts";
import { adminLandingPath, hasInactiveStaffMembership, listActiveStaffOrganizations } from "@/lib/auth/tenant";
import { createSession, requestIsHttps, sessionCookieOptions } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeRedirect(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function loginPath(audience: LoginAudience): string {
  if (audience === "admin") return "/admin/login";
  if (audience === "console") return "/console/login";
  return "/login/email";
}

function parseAudience(value: string): LoginAudience {
  if (value === "admin" || value === "console") return value;
  return "app";
}

function redirectOn(request: Request, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, `${publicOrigin(request)}/`), 303);
}

async function readLoginBody(request: Request): Promise<{
  email: string;
  password: string;
  redirect: string;
  audience: LoginAudience;
  viaForm: boolean;
}> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
      redirect?: unknown;
      audience?: unknown;
    };
    return {
      email: typeof body.email === "string" ? body.email.trim() : "",
      password: typeof body.password === "string" ? body.password : "",
      redirect: typeof body.redirect === "string" ? body.redirect : "/",
      audience: parseAudience(typeof body.audience === "string" ? body.audience : "app"),
      viaForm: false,
    };
  }
  const fd = await request.formData();
  return {
    email: String(fd.get("email") ?? "").trim(),
    password: String(fd.get("password") ?? ""),
    redirect: String(fd.get("redirect") ?? "/"),
    audience: parseAudience(String(fd.get("audience") ?? "app")),
    viaForm: true,
  };
}

async function attachCookie(
  response: NextResponse,
  request: Request,
  token: string,
): Promise<NextResponse> {
  const opts = sessionCookieOptions(
    token,
    false,
    request.headers.get("host") ?? "",
    requestIsHttps(request),
  );
  const cookieStore = await cookies();
  cookieStore.set(opts);
  response.cookies.set(opts);
  return response;
}

function fail(
  viaForm: boolean,
  request: Request,
  audience: LoginAudience,
  error: string,
  message: string,
  status: number,
): Response {
  if (viaForm) {
    return redirectOn(request, `${loginPath(audience)}?error=${encodeURIComponent(error)}`);
  }
  return NextResponse.json({ error, message }, { status });
}

async function destinationFor(input: {
  role: "admin" | "tester";
  email: string;
  audience: LoginAudience;
  redirect: string;
  mustChangePassword: boolean;
}): Promise<string | { error: string; message: string }> {
  if (input.audience === "console") {
    if (!isInternalAccount(input.role)) {
      return { error: "NOT_INTERNAL", message: "이 계정은 내부 운영 권한이 없습니다." };
    }
    if (input.mustChangePassword) return "/console/password";
    return input.redirect.startsWith("/console") ? safeRedirect(input.redirect) : "/console";
  }

  if (input.audience === "admin") {
    const memberships = await listActiveStaffOrganizations(input.email);
    if (
      !canAccessInstitutionAdmin({
        email: input.email,
        role: input.role,
        hasOrgMembership: memberships.length > 0,
      })
    ) {
      if (await hasInactiveStaffMembership(input.email)) {
        return { error: "ACCOUNT_INACTIVE", message: "비활성화된 계정입니다." };
      }
      return { error: "NOT_ORG_STAFF", message: "이 계정은 기관 관리자 권한이 없습니다." };
    }
    if (input.mustChangePassword) return "/admin/password";
    if (input.redirect.startsWith("/admin/") && input.redirect !== "/admin/login" && input.redirect !== "/admin/password") {
      return safeRedirect(input.redirect);
    }
    return adminLandingPath(input.email);
  }

  if (isInternalAccount(input.role)) {
    return input.mustChangePassword ? "/console/password" : "/console";
  }
  if (input.mustChangePassword) return "/password";
  if (input.redirect.startsWith("/console") || input.redirect.startsWith("/admin")) return "/";
  return safeRedirect(input.redirect);
}

export async function POST(request: Request): Promise<Response> {
  let parsed: Awaited<ReturnType<typeof readLoginBody>>;
  try {
    parsed = await readLoginBody(request);
  } catch {
    return fail(false, request, "app", "INVALID_BODY", "요청 형식이 올바르지 않아요.", 400);
  }

  const { email, password, viaForm, audience } = parsed;
  if (!email || !password) {
    return fail(viaForm, request, audience, "INVALID_BODY", "이메일과 비밀번호를 모두 입력해주세요.", 400);
  }

  const result = await loginAccount(email, password);
  if (!result.ok) {
    if (result.reason === "unknown_email") {
      return fail(viaForm, request, audience, "UNKNOWN_EMAIL", "등록되지 않은 이메일이에요.", 401);
    }
    if (result.reason === "deactivated") {
      return fail(viaForm, request, audience, "ACCOUNT_INACTIVE", "비활성화된 계정입니다.", 403);
    }
    if (result.reason === "social_only") {
      return fail(viaForm, request, audience, "SOCIAL_ONLY", "이 계정은 소셜 로그인을 사용해주세요.", 401);
    }
    return fail(viaForm, request, audience, "WRONG_PASSWORD", "비밀번호가 맞지 않아요.", 401);
  }

  const dest = await destinationFor({
    role: result.account.role,
    email: result.account.email,
    audience,
    redirect: parsed.redirect,
    mustChangePassword: result.mustChangePassword,
  });
  if (typeof dest !== "string") {
    return fail(viaForm, request, audience, dest.error, dest.message, 403);
  }

  try {
    const token = await createSession(result.account.email, result.account.role, {
      mustChangePassword: result.mustChangePassword,
    });
    if (viaForm) {
      return attachCookie(redirectOn(request, dest), request, token);
    }
    return attachCookie(
      NextResponse.json({ ok: true, role: result.account.role, redirect: dest }),
      request,
      token,
    );
  } catch {
    return fail(viaForm, request, audience, "SERVER_ERROR", "로그인 서버에 문제가 있어요. 잠시 후 다시 시도해주세요.", 500);
  }
}
