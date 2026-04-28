// Design Ref: §4.2 GET /api/usage — return remaining video_ai_use count for session user
// Plan SC: FR-06
import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { checkGate } from "@/lib/usage/tracker";

export async function GET(request: Request): Promise<Response> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (session.role === "admin") {
    return NextResponse.json({ used: null, limit: null, remaining: null, role: "admin" });
  }

  const gate = await checkGate(session.email);
  return NextResponse.json({ ...gate, role: "tester" });
}
