import AdminShell from "@/components/admin/AdminShell";
import { requireConsoleSession } from "@/lib/auth/page-session";
import { listUsageAccounts } from "@/lib/auth/accounts";
import { getAdminUserDetails } from "@/lib/usage/tracker";

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function CreditBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const color = pct >= 100 ? "bg-red-400" : pct >= 66 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-gray-500">
        {used}/{limit}
      </span>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}

export default async function ConsolePage() {
  const session = await requireConsoleSession();
  const accounts = await listUsageAccounts();
  const kindByEmail = Object.fromEntries(accounts.map((row) => [row.email.toLowerCase(), row.kind]));
  const testerEmails = accounts.map((row) => row.email);
  const users = await getAdminUserDetails(testerEmails);

  const totalUse = users.reduce((s, u) => s + u.video_ai_use, 0);
  const totalPaywall = users.reduce((s, u) => s + u.paywall_shown, 0);
  const totalCta = users.reduce((s, u) => s + u.paywall_cta_click, 0);

  return (
    <AdminShell
      email={session.email}
      active="users"
      title="이용 현황"
      subtitle="등록된 테스터 계정의 사용 현황"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <StatCard label="총 유저" value={users.length} sub="등록된 계정" />
        <StatCard label="총 사용 횟수" value={totalUse} sub="video_ai_use 합계" />
        <StatCard label="페이월 노출" value={totalPaywall} sub="paywall_shown 합계" />
        <StatCard label="CTA 전환율" value={totalPaywall > 0 ? `${Math.round((totalCta / totalPaywall) * 100)}%` : "—"} sub={`${totalCta}건 클릭`} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">이메일</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">구분</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">가입일</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">마지막 사용</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">크래딧</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">페이월 노출</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">CTA 클릭</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">이탈</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                  등록된 테스터가 없습니다.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.email} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-800 font-medium text-xs max-w-[180px] truncate">
                  {u.email}
                </td>
                <td className="px-4 py-3">
                  <KindBadge kind={kindByEmail[u.email.toLowerCase()] ?? "end"} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">
                  {formatDate(u.firstSeenAt)}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">
                  {formatDate(u.lastSeenAt)}
                </td>
                <td className="px-4 py-3">
                  <CreditBar used={u.creditsUsed} limit={u.creditsLimit} />
                </td>
                <td className="px-4 py-3 text-center text-xs tabular-nums text-gray-700">
                  {u.paywall_shown}
                </td>
                <td className="px-4 py-3 text-center text-xs tabular-nums text-gray-700">
                  {u.paywall_cta_click}
                </td>
                <td className="px-4 py-3 text-center text-xs tabular-nums text-gray-500">
                  {u.paywall_dismiss}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function KindBadge({ kind }: { kind: "org" | "end" }) {
  if (kind === "org") {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
        기관
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
      엔드유저
    </span>
  );
}
