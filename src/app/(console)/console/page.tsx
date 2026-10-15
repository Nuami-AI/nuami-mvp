import { AccountKindBadge } from "@/components/admin/AccountKindBadge";
import AdminShell from "@/components/admin/AdminShell";
import { isSuperAdmin } from "@/lib/auth/access";
import { requireConsoleSession } from "@/lib/auth/page-session";
import { listUsageAccounts } from "@/lib/auth/accounts";
import { formatKstDateTime } from "@/lib/datetime";
import { getAdminUserDetails } from "@/lib/usage/tracker";

function CreditBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const color = pct >= 100 ? "bg-red-400" : pct >= 66 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums text-gray-500">
        {used}/{limit}
      </span>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}

export default async function ConsolePage() {
  const session = await requireConsoleSession();
  const showLastLogin = isSuperAdmin(session.email);
  const accounts = await listUsageAccounts();
  const kindByEmail = Object.fromEntries(accounts.map((row) => [row.email.toLowerCase(), row.kind]));
  const testerEmails = accounts.map((row) => row.email);
  const users = (await getAdminUserDetails(testerEmails)).map((user) =>
    showLastLogin ? user : { ...user, lastLoginAt: null },
  );

  const totalUse = users.reduce((s, u) => s + u.video_ai_use, 0);
  const totalPaywall = users.reduce((s, u) => s + u.paywall_shown, 0);
  const totalCta = users.reduce((s, u) => s + u.paywall_cta_click, 0);

  return (
    <AdminShell
      email={session.email}
      active="users"
      title="이용 현황"
      subtitle="등록된 이용자의 사용 현황"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <StatCard label="총 이용자" value={users.length} />
        <StatCard label="총 사용 횟수" value={totalUse} />
        <StatCard label="페이월 노출" value={totalPaywall} />
        <StatCard label="CTA 전환율" value={totalPaywall > 0 ? `${Math.round((totalCta / totalPaywall) * 100)}%` : "—"} sub={`${totalCta}건 클릭`} />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="admin-scroll">
        <table className="admin-table">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">이메일</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">구분</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">가입일</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">마지막 사용</th>
              {showLastLogin ? (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">마지막 로그인</th>
              ) : null}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">크래딧</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">페이월 노출</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">CTA 클릭</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">이탈</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 && (
              <tr>
                <td colSpan={showLastLogin ? 9 : 8} className="px-4 py-10 text-center text-gray-400">
                  등록된 이용자가 없습니다.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.email} className="hover:bg-gray-50 transition-colors">
                <td className="max-w-[180px] truncate px-4 py-3 font-medium text-gray-800">
                  {u.email}
                </td>
                <td className="px-4 py-3">
                  <AccountKindBadge kind={kindByEmail[u.email.toLowerCase()] ?? "end"} />
                </td>
                <td className="px-4 py-3 tabular-nums text-gray-500">
                  {formatKstDateTime(u.firstSeenAt)}
                </td>
                <td className="px-4 py-3 tabular-nums text-gray-500">
                  {formatKstDateTime(u.lastSeenAt)}
                </td>
                {showLastLogin ? (
                  <td className="px-4 py-3 tabular-nums text-gray-500">
                    {formatKstDateTime(u.lastLoginAt)}
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <CreditBar used={u.creditsUsed} limit={u.creditsLimit} />
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                  {u.paywall_shown}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                  {u.paywall_cta_click}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                  {u.paywall_dismiss}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </AdminShell>
  );
}

