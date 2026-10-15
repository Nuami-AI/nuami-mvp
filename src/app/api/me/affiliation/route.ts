import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { setEndUserAffiliation } from "@/lib/auth/tenant";
import { getInstitution } from "@/lib/institution/catalog";
import { isVerifiedStudentId } from "@/lib/institution/verify";
import { prismaAccounts as prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const row = await prisma.endUserOrganization.findFirst({
    where: { email: session.email.toLowerCase(), status: "ACTIVE" },
    orderBy: { joinedAt: "desc" },
  });
  if (!row) {
    return NextResponse.json({ organizationId: null, organizationName: null });
  }
  const org = getInstitution(row.organizationId);
  return NextResponse.json({
    organizationId: row.organizationId,
    organizationName: org?.nameKo ?? row.organizationId,
  });
}

export async function POST(request: Request): Promise<Response> {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    organizationId?: unknown;
    studentId?: unknown;
  } | null;
  const organizationId = typeof body?.organizationId === "string" ? body.organizationId : "";
  const studentId = typeof body?.studentId === "string" ? body.studentId : "";
  if (!organizationId || !getInstitution(organizationId)) {
    return NextResponse.json({ error: "INVALID_ORGANIZATION" }, { status: 400 });
  }

  const user = await prisma.authUser.findUnique({
    where: { email: session.email.toLowerCase() },
    select: { accountType: true },
  });
  const allowConsoleBypass = user?.accountType === "INTERNAL";
  if (!isVerifiedStudentId(studentId, organizationId, { allowConsoleBypass })) {
    return NextResponse.json({ error: "INVALID_STUDENT_ID", message: "학번을 확인할 수 없습니다." }, { status: 400 });
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
