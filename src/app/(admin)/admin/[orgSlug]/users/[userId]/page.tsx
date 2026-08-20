import { notFound, redirect } from "next/navigation";

import InstitutionShell from "@/components/admin/InstitutionShell";
import { hasOrgPermission, maskEmail } from "@/lib/auth/access";
import { resolveOrgAccess } from "@/lib/auth/page-session";
import { getActiveEndUserInOrganization } from "@/lib/auth/tenant";
import { getAdminUserDetails } from "@/lib/usage/tracker";

export default async function InstitutionUserDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; userId: string }>;
}) {
  const { orgSlug, userId } = await params;
  const { session, institution, membershipRole } = await resolveOrgAccess(orgSlug);
  if (!hasOrgPermission(membershipRole, "users.read")) redirect("/admin/denied");

  const membership = await getActiveEndUserInOrganization(userId, institution.id);
  if (!membership) notFound();

  const [usage] = await getAdminUserDetails([membership.email]);

  return (
    <InstitutionShell
      email={session.email}
      institution={institution}
      membershipRole={membershipRole}
      active="users"
      showUsers
      title="사용자 상세"
      subtitle="소속 기관이 일치하는 이용자만 조회됩니다."
    >
      <div className="max-w-md rounded-xl border border-gray-200 bg-white px-5 py-4 space-y-2">
        <p className="text-sm font-semibold text-gray-900">{maskEmail(membership.email)}</p>
        <p className="text-xs text-gray-500">가입 {membership.joinedAt.toLocaleDateString("ko-KR")}</p>
        <p className="text-xs text-gray-500">
          최근 이용 {usage?.lastSeenAt ? usage.lastSeenAt.toLocaleDateString("ko-KR") : "—"}
        </p>
        <p className="text-xs text-gray-500">이용 횟수 {usage?.video_ai_use ?? 0}</p>
      </div>
    </InstitutionShell>
  );
}
