import InstitutionShell from "@/components/admin/InstitutionShell";
import KnowledgeManager from "@/components/admin/KnowledgeManager";
import { hasOrgPermission } from "@/lib/auth/access";
import { resolveOrgAccess } from "@/lib/auth/page-session";

export default async function InstitutionContentPage({
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
      active="content"
      showUsers={hasOrgPermission(membershipRole, "users.read")}
      title="콘텐츠"
      subtitle="공식 홈페이지와 PDF를 등록합니다."
    >
      <KnowledgeManager lockedInstitutionId={institution.id} view="content" />
    </InstitutionShell>
  );
}
