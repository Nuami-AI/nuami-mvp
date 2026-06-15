import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";

export async function GET(request: Request): Promise<Response> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const local = session.email.split("@")[0] ?? "user";
  const displayName = local.charAt(0).toUpperCase() + local.slice(1);

  return NextResponse.json({ email: session.email, displayName });
}
