import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";

/** Returns auth state without 401 — for client-side session probes (e.g. /login redirect). */
export async function GET(request: Request): Promise<Response> {
  const session = await getSessionFromRequest(request);
  return NextResponse.json({ authenticated: Boolean(session) });
}
