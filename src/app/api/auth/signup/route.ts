import { NextResponse } from "next/server";

import { consumeChallenge, issueChallenge, verifyChallenge } from "@/lib/auth/challenge";
import { hashPassword, isValidEmail, isValidPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "request-code" | "verify-code" | "complete";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    email?: unknown;
    code?: unknown;
    password?: unknown;
    marketingAgreed?: unknown;
    thirdPartyAgreed?: unknown;
  } | null;

  const action = body?.action as Action | undefined;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!action || !isValidEmail(email)) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }
  if (action === "request-code") {
    const existing = await prisma.authUser.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    const issued = await issueChallenge(email, "signup");
    return NextResponse.json({ ok: true, devCode: issued.code ?? null });
  }

  const code = typeof body?.code === "string" ? body.code : "";
  if (action === "verify-code") {
    const ok = await verifyChallenge(email, "signup", code);
    if (!ok) return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "complete") {
    const password = typeof body?.password === "string" ? body.password : "";
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "WEAK_PASSWORD" }, { status: 400 });
    }
    const consumed = await consumeChallenge(email, "signup", code);
    if (!consumed) return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
    const existing = await prisma.authUser.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    await prisma.authUser.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        status: "ACTIVE",
        accountType: "END_USER",
        marketingAgreed: body?.marketingAgreed === true,
        thirdPartyAgreed: body?.thirdPartyAgreed === true,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
}
