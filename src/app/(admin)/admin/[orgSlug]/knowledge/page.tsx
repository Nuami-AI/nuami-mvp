import InstitutionShell from "@/components/admin/InstitutionShell";
import KnowledgeManager from "@/components/admin/KnowledgeManager";
import { hasOrgPermission } from "@/lib/auth/access";
import { resolveOrgAccess } from "@/lib/auth/page-session";

export default async function InstitutionKnowledgePage({
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
      active="knowledge"
      showUsers={hasOrgPermission(membershipRole, "users.read")}
      title="안내 지식"
      subtitle="학생에게 나가는 검증된 사실입니다. 항목을 열어 확인하고, 틀리면 삭제하세요."
    >
      <KnowledgeManager lockedInstitutionId={institution.id} view="knowledge" />
    </InstitutionShell>
  );
}
