import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { envAccountEmail } from "@/lib/auth/accounts";
import { consumeChallenge, issueChallenge, verifyChallenge } from "@/lib/auth/challenge";
import { TEMP_ORG_PASSWORD } from "@/lib/auth/issue-org-staff";
import { hashPassword, isValidEmail, isValidPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  getSessionFromRequest,
  requestIsHttps,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { adminLandingPath } from "@/lib/auth/tenant";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "request-code" | "verify-code" | "reset" | "change";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    email?: unknown;
    code?: unknown;
    password?: unknown;
    currentPassword?: unknown;
  } | null;

  const action = body?.action as Action | undefined;

  if (action === "change") {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (envAccountEmail(session.email)) {
      return NextResponse.json({ error: "ENV_ACCOUNT", message: "이 계정은 여기서 바꿀 수 없습니다." }, { status: 400 });
    }

    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!isValidPassword(password) || password === TEMP_ORG_PASSWORD) {
      return NextResponse.json(
        { error: "WEAK_PASSWORD", message: "비밀번호는 8자 이상이어야 합니다." },
        { status: 400 },
      );
    }

    const user = await prisma.authUser.findUnique({ where: { email: session.email, status: "ACTIVE" } });
    if (!user?.passwordHash) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "WRONG_PASSWORD", message: "현재 비밀번호가 맞지 않아요." }, { status: 401 });
    }

    await prisma.authUser.update({
      where: { email: session.email },
      data: { passwordHash: hashPassword(password), passwordMustChange: false },
    });

    const token = await createSession(session.email, session.role);
    const opts = sessionCookieOptions(token, false, request.headers.get("host") ?? "", requestIsHttps(request));
    const cookieStore = await cookies();
    cookieStore.set(opts);
    const redirect = await adminLandingPath(session.email);
    const res = NextResponse.json({ ok: true, redirect });
    res.cookies.set(opts);
    return res;
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!action || !isValidEmail(email)) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  if (action === "request-code") {
    if (envAccountEmail(email)) {
      return NextResponse.json({ error: "EMAIL_NOT_FOUND" }, { status: 404 });
    }
    const user = await prisma.authUser.findUnique({ where: { email, status: "ACTIVE" } });
    if (!user) return NextResponse.json({ error: "EMAIL_NOT_FOUND" }, { status: 404 });
    const issued = await issueChallenge(email, "reset");
    return NextResponse.json({ ok: true, devCode: issued.code ?? null });
  }

  const code = typeof body?.code === "string" ? body.code : "";
  if (action === "verify-code") {
    const ok = await verifyChallenge(email, "reset", code);
    if (!ok) return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "reset") {
    const password = typeof body?.password === "string" ? body.password : "";
    if (!isValidPassword(password) || password === TEMP_ORG_PASSWORD) {
      return NextResponse.json({ error: "WEAK_PASSWORD" }, { status: 400 });
    }
    const consumed = await consumeChallenge(email, "reset", code);
    if (!consumed) return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
    await prisma.authUser.updateMany({
      where: { email, status: "ACTIVE" },
      data: { passwordHash: hashPassword(password), passwordMustChange: false },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
}
