// Design Ref: §4.2 POST /api/auth/login — validate credentials, issue JWT cookie
// Plan SC: FR-01
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { findAccount } from "@/lib/auth/accounts";
import { createSession, sessionCookieOptions } from "@/lib/auth/session";

export async function POST(request: Request): Promise<Response> {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const account = findAccount(email, password);
  if (!account) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const token = await createSession(account.email, account.role);
  const cookieStore = await cookies();
  const opts = sessionCookieOptions(token);
  cookieStore.set(opts);

  return NextResponse.json({ ok: true, role: account.role });
}
