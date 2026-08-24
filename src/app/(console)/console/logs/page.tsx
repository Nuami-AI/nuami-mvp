import AdminShell from "@/components/admin/AdminShell";
import { requireConsoleSession } from "@/lib/auth/page-session";
import { getInstitution } from "@/lib/institution/catalog";
import { prisma } from "@/lib/db";

export default async function ConsoleLogsPage() {
  const session = await requireConsoleSession();
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
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">시간</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">행위자</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">유형</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">액션</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">대상</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                  아직 로그가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const org = row.organizationId ? getInstitution(row.organizationId) : undefined;
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs tabular-nums text-gray-500 whitespace-nowrap">
                      {row.createdAt.toLocaleString("ko-KR")}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-800">{row.actorEmail}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{row.actorType}</td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-800">{row.action}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
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
    </AdminShell>
  );
}
