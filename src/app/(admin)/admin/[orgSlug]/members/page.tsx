import { redirect } from "next/navigation";

import InstitutionShell from "@/components/admin/InstitutionShell";
import { OrgStaffMembersPanel } from "@/components/admin/OrgStaffMembersPanel";
import { hasOrgPermission } from "@/lib/auth/access";
import { resolveOrgAccess } from "@/lib/auth/page-session";
import { listVisibleOrgStaff } from "@/lib/auth/issue-org-staff";

export default async function InstitutionMembersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { session, institution, membershipRole } = await resolveOrgAccess(orgSlug);
  if (!hasOrgPermission(membershipRole, "users.write")) redirect("/admin/denied");

  const members = await listVisibleOrgStaff(institution.id);

  return (
    <InstitutionShell
      email={session.email}
      institution={institution}
      membershipRole={membershipRole}
      active="members"
      showUsers={hasOrgPermission(membershipRole, "users.read")}
      title="멤버"
      subtitle="대표와 관리자만 멤버를 추가하고 역할을 바꿀 수 있습니다. 비밀번호 초기화·비활성화·삭제도 가능합니다."
    >
      <OrgStaffMembersPanel
        organizationId={institution.id}
        actorEmail={session.email}
        members={members.map((row) => ({
          id: row.id,
          email: row.email,
          role: row.role,
          status: row.status,
        }))}
      />
    </InstitutionShell>
  );
}
