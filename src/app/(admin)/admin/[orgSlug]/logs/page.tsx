import InstitutionShell from "@/components/admin/InstitutionShell";
import KnowledgeManager from "@/components/admin/KnowledgeManager";
import { hasOrgPermission } from "@/lib/auth/access";
import { resolveOrgAccess } from "@/lib/auth/page-session";

export default async function InstitutionLogsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { session, institution, membershipRole } = await resolveOrgAccess(orgSlug);

  return (
    <InstitutionShell
      email={session.email}
      institution={institution}
      membershipRole={membershipRole}
      active="logs"
      showUsers={hasOrgPermission(membershipRole, "users.read")}
      title="로그"
      subtitle="자료 등록·학습 이력입니다."
    >
      <KnowledgeManager lockedInstitutionId={institution.id} view="logs" />
    </InstitutionShell>
  );
}
