import Link from "next/link";

import AdminShell from "@/components/admin/AdminShell";
import { requireConsoleSession } from "@/lib/auth/page-session";
import { prisma } from "@/lib/db";
import {
  INSTITUTION_CATALOG,
  organizationSlugOf,
} from "@/lib/institution/catalog";
import { ensureInstitutions } from "@/lib/institution/seed";

export default async function ConsoleOrganizationsPage() {
  const session = await requireConsoleSession();
  await ensureInstitutions();

  const [docCounts, knowledgeCounts, memberCounts] = await Promise.all([
    prisma.institutionDocument.groupBy({ by: ["institutionId"], _count: { _all: true } }),
    prisma.institutionKnowledge.groupBy({ by: ["institutionId"], _count: { _all: true } }),
    prisma.organizationMember.groupBy({ by: ["organizationId"], _count: { _all: true } }),
  ]);

  const docs = Object.fromEntries(docCounts.map((row) => [row.institutionId, row._count._all]));
  const knowledge = Object.fromEntries(knowledgeCounts.map((row) => [row.institutionId, row._count._all]));
  const members = Object.fromEntries(memberCounts.map((row) => [row.organizationId, row._count._all]));

  return (
    <AdminShell
      email={session.email}
      active="organizations"
      title="기관"
      subtitle="기관을 고른 뒤 담당자 이메일을 넣으면 임시 비밀번호 1234로 발급됩니다."
    >
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">기관</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">Slug</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase">문서</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase">지식</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase">멤버</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {INSTITUTION_CATALOG.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{row.nameKo}</p>
                  <p className="text-[11px] text-gray-400">{row.city} · {row.id}</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 font-mono">{organizationSlugOf(row)}</td>
                <td className="px-4 py-3 text-center text-xs tabular-nums">{docs[row.id] ?? 0}</td>
                <td className="px-4 py-3 text-center text-xs tabular-nums">{knowledge[row.id] ?? 0}</td>
                <td className="px-4 py-3 text-center text-xs tabular-nums">{members[row.id] ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/console/organizations/${row.id}`} className="text-xs font-medium text-gray-700 hover:text-gray-900">
                    계정 발급
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
