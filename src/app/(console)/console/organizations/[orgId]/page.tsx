import Link from "next/link";
import { notFound } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { IssueOrgStaffForm } from "@/components/console/IssueOrgStaffForm";
import { requireConsoleSession } from "@/lib/auth/page-session";
import { prisma } from "@/lib/db";
import { getInstitution } from "@/lib/institution/catalog";
import { ensureInstitutions } from "@/lib/institution/seed";

export default async function ConsoleOrganizationStaffPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const session = await requireConsoleSession();
  const { orgId } = await params;
  await ensureInstitutions();
  const institution = getInstitution(orgId);
  if (!institution) notFound();

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: institution.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell
      email={session.email}
      active="organizations"
      title={institution.nameKo}
      subtitle={`${institution.city} · ${institution.id} — 기관 담당자 계정 발급`}
    >
      <Link href="/console/organizations" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-800">
        ← 기관 목록
      </Link>
      <IssueOrgStaffForm organizationId={institution.id} />
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-gray-400">이메일</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-gray-400">역할</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-gray-400">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">
                  아직 발급된 기관 계정이 없습니다.
                </td>
              </tr>
            ) : (
              members.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.email}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{row.role}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{row.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
