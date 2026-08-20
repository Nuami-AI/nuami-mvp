import Link from "next/link";

import { prisma } from "@/lib/db";
import InstitutionShell from "@/components/admin/InstitutionShell";
import { hasOrgPermission } from "@/lib/auth/access";
import { resolveOrgAccess } from "@/lib/auth/page-session";
import { institutionAdminPath } from "@/lib/institution/catalog";
import { ensureInstitutions } from "@/lib/institution/seed";

export default async function InstitutionDashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { session, institution, membershipRole } = await resolveOrgAccess(orgSlug);
  await ensureInstitutions();

  const [documentCount, knowledgeCount] = await Promise.all([
    prisma.institutionDocument.count({ where: { institutionId: institution.id } }),
    prisma.institutionKnowledge.count({ where: { institutionId: institution.id } }),
  ]);

  const base = institutionAdminPath(institution);

  return (
    <InstitutionShell
      email={session.email}
      institution={institution}
      membershipRole={membershipRole}
      active="dashboard"
      showUsers={hasOrgPermission(membershipRole, "users.read")}
      title="대시보드"
      subtitle={`${institution.nameKo} 콘텐츠 현황`}
    >
      <div className="grid grid-cols-2 gap-3 max-w-xl">
        <Link href={`${base}/logs`} className="rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-gray-300">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">수집 로그</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{documentCount}</p>
        </Link>
        <Link href={`${base}/knowledge`} className="rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-gray-300">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">안내 지식</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{knowledgeCount}</p>
        </Link>
      </div>
      <p className="mt-6 text-sm text-gray-400">
        자료 등록은 콘텐츠, 검수는 안내 지식, 파일·페이지 이력은 로그에서 봅니다.
      </p>
    </InstitutionShell>
  );
}
