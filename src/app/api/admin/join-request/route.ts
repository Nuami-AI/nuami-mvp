import { NextResponse } from "next/server";

import { isValidEmail } from "@/lib/auth/password";
import { writeAudit } from "@/lib/auth/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as {
    organizationName?: unknown;
    contactEmail?: unknown;
    message?: unknown;
  } | null;

  const organizationName = typeof body?.organizationName === "string" ? body.organizationName.trim() : "";
  const contactEmail = typeof body?.contactEmail === "string" ? body.contactEmail.trim().toLowerCase() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!organizationName || !isValidEmail(contactEmail)) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  await writeAudit({
    actorEmail: contactEmail,
    actorType: "ORG_REQUEST",
    action: "org.access.request",
    resourceType: "organization_request",
    metadata: { organizationName, message },
  });

  return NextResponse.json({ ok: true });
}
