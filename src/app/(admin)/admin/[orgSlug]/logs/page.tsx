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
      active="logs"
      showUsers={hasOrgPermission(membershipRole, "users.read")}
      title="로그"
      subtitle="업로드한 파일과 홈페이지에서 읽어 온 페이지 이력입니다."
    >
      <KnowledgeManager lockedInstitutionId={institution.id} view="logs" />
    </InstitutionShell>
  );
}
