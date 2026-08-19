import { NextResponse } from "next/server";

import { requireOrgAccess } from "@/lib/auth/require-admin";
import { writeAudit } from "@/lib/auth/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const auth = await requireOrgAccess(request, id, "settings.write");
  if (auth.error) return auth.error;
  return NextResponse.json({ ok: true, organizationId: id });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const auth = await requireOrgAccess(request, id, "settings.write");
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  await writeAudit({
    actorEmail: auth.session.email,
    actorType: auth.membershipRole === "NUAMI_SUPER_ADMIN" ? "INTERNAL" : "ORG_STAFF",
    organizationId: id,
    action: "settings.write",
    resourceType: "organization",
    resourceId: id,
  }).catch(() => {});
  return NextResponse.json({ ok: true, organizationId: id });
}
