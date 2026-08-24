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
      subtitle="학생에게 안내되는 검증된 사실입니다."
    >
      <KnowledgeManager lockedInstitutionId={institution.id} view="knowledge" />
    </InstitutionShell>
  );
}
