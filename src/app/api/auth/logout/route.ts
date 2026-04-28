// Design Ref: §4.2 POST /api/auth/logout — clear session cookie
// Plan SC: FR-03
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sessionCookieOptions } from "@/lib/auth/session";

export async function POST(): Promise<Response> {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieOptions("", true));
  return NextResponse.json({ ok: true });
}
