// Design Ref: §4.2 POST /api/usage/event — log paywall CTA interactions
// Plan SC: FR-09
import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { logEvent, type UsageAction } from "@/lib/usage/tracker";

const ALLOWED_ACTIONS: UsageAction[] = ["paywall_cta_click", "paywall_dismiss", "paywall_shown"];

export async function POST(request: Request): Promise<Response> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: { action?: unknown; metadata?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const action = body.action as UsageAction;
  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
  }

  const metadata =
    body.metadata && typeof body.metadata === "object" ? (body.metadata as object) : undefined;

  await logEvent(session.email, action, metadata);
  return NextResponse.json({ ok: true });
}
