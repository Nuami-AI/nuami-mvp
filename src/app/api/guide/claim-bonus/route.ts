import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { claimGuideBonus, checkGate } from "@/lib/usage/tracker";

export async function POST(request: Request): Promise<Response> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { claimed, alreadyClaimed } = await claimGuideBonus(session.email);

  if (alreadyClaimed) {
    return NextResponse.json({ error: "ALREADY_CLAIMED" }, { status: 409 });
  }

  const gate = await checkGate(session.email);
  return NextResponse.json({ ok: true, claimed, remaining: gate.remaining, limit: gate.limit });
}
