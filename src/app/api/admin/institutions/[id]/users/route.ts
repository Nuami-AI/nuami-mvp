import { NextResponse } from "next/server";

import { maskEmail } from "@/lib/auth/access";
import { requireOrgAccess } from "@/lib/auth/require-admin";
import { listActiveEndUsersByOrganization } from "@/lib/auth/tenant";
import { getAdminUserDetails } from "@/lib/usage/tracker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const auth = await requireOrgAccess(request, id, "users.read");
  if (auth.error) return auth.error;

  const memberships = await listActiveEndUsersByOrganization(id);
  const emails = memberships.map((row) => row.email);
  const details = await getAdminUserDetails(emails);
  const byEmail = new Map(details.map((row) => [row.email.toLowerCase(), row]));

  return NextResponse.json({
    users: memberships.map((row) => {
      const usage = byEmail.get(row.email.toLowerCase());
      return {
        id: row.id,
        displayName: maskEmail(row.email),
        joinedAt: row.joinedAt,
        lastSeenAt: usage?.lastSeenAt ?? null,
        usageCount: usage?.video_ai_use ?? 0,
        language: "ko",
        status: row.status,
      };
    }),
  });
}
