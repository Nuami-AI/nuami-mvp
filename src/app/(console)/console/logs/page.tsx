import AdminShell from "@/components/admin/AdminShell";
import { auditActionLabel, auditActorTypeLabel } from "@/lib/auth/audit-labels";
import { requireSuperAdminSession } from "@/lib/auth/page-session";
import { formatKstDateTime } from "@/lib/datetime";
import { getInstitution } from "@/lib/institution/catalog";
import { prisma } from "@/lib/db";

export default async function ConsoleLogsPage() {
  const session = await requireSuperAdminSession();
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <AdminShell
      email={session.email}
      active="logs"
      title="로그"
      subtitle="계정 발급·권한 변경 이력입니다."
    >
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="admin-scroll">
        <table className="admin-table">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">시간</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">행위자</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">유형</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">액션</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">대상</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  아직 로그가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const org = row.organizationId ? getInstitution(row.organizationId) : undefined;
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-500">
                      {formatKstDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.actorEmail}</td>
                    <td className="px-4 py-3 text-gray-500">{auditActorTypeLabel(row.actorType)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{auditActionLabel(row.action)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {org ? org.nameKo : row.organizationId ?? "—"}
                      {row.resourceId ? ` · ${row.resourceId}` : ""}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </AdminShell>
  );
}
