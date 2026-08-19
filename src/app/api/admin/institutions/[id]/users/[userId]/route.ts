import { NextResponse } from "next/server";

import { maskEmail } from "@/lib/auth/access";
import { requireOrgAccess } from "@/lib/auth/require-admin";
import { getActiveEndUserInOrganization } from "@/lib/auth/tenant";
import { getAdminUserDetails } from "@/lib/usage/tracker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; userId: string }> },
): Promise<Response> {
  const { id, userId } = await context.params;
  const auth = await requireOrgAccess(request, id, "users.read");
  if (auth.error) return auth.error;

  const membership = await getActiveEndUserInOrganization(userId, id);
  if (!membership) {
    return NextResponse.json({ error: "FORBIDDEN", message: "접근 권한이 없습니다." }, { status: 403 });
  }

  const [usage] = await getAdminUserDetails([membership.email]);
  return NextResponse.json({
    user: {
      id: membership.id,
      displayName: maskEmail(membership.email),
      joinedAt: membership.joinedAt,
      lastSeenAt: usage?.lastSeenAt ?? null,
      usageCount: usage?.video_ai_use ?? 0,
      language: "ko",
      status: membership.status,
    },
  });
}
