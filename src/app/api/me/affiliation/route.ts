import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { setEndUserAffiliation } from "@/lib/auth/tenant";
import { getInstitution } from "@/lib/institution/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { organizationId?: unknown } | null;
  const organizationId = typeof body?.organizationId === "string" ? body.organizationId : "";
  if (!organizationId || !getInstitution(organizationId)) {
    return NextResponse.json({ error: "INVALID_ORGANIZATION" }, { status: 400 });
  }

  await setEndUserAffiliation(session.email, organizationId);
  return NextResponse.json({ ok: true, organizationId });
}

export async function DELETE(request: Request): Promise<Response> {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  await setEndUserAffiliation(session.email, null);
  return NextResponse.json({ ok: true });
}
