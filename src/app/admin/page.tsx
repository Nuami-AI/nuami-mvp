// Design Ref: §5.4 /admin dashboard — Server Component, admin-only (proxy.ts enforces)
// Plan SC: FR-10
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionFromRequest } from "@/lib/auth/session";
import { getTesterEmails } from "@/lib/auth/accounts";
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

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        isAdmin
          ? "bg-purple-100 text-purple-700"
          : "bg-sky-100 text-sky-700"
      }`}
    >
      {isAdmin ? "Admin" : "Tester"}
    </span>
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

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("nuami-session");

  if (!sessionCookie?.value) redirect("/login");

  const mockRequest = new Request("http://localhost", {
    headers: { cookie: `nuami-session=${sessionCookie.value}` },
  });
  const session = await getSessionFromRequest(mockRequest);

  if (!session || session.role !== "admin") redirect("/");

  const testerEmails = getTesterEmails();
  const users = await getAdminUserDetails(testerEmails);

  const totalUse = users.reduce((s, u) => s + u.video_ai_use, 0);
  const totalPaywall = users.reduce((s, u) => s + u.paywall_shown, 0);
  const totalCta = users.reduce((s, u) => s + u.paywall_cta_click, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 flex flex-col border-r border-gray-200 bg-white">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Nuami</p>
          <p className="mt-0.5 text-sm font-bold text-gray-900">Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <SidebarItem label="개요" active={false} />
          <SidebarItem label="유저 관리" active={true} />
          <SidebarItem label="사용 통계" active={false} />
        </nav>

        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 truncate mb-2">{session.email}</p>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="px-8 py-7">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">유저 관리</h1>
            <p className="mt-0.5 text-sm text-gray-400">등록된 테스터 계정의 사용 현황</p>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
            <StatCard label="총 유저" value={users.length} sub="등록된 계정" />
            <StatCard label="총 사용 횟수" value={totalUse} sub="video_ai_use 합계" />
            <StatCard label="페이월 노출" value={totalPaywall} sub="paywall_shown 합계" />
            <StatCard label="CTA 전환율" value={totalPaywall > 0 ? `${Math.round((totalCta / totalPaywall) * 100)}%` : "—"} sub={`${totalCta}건 클릭`} />
          </div>

          {/* User table */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">이메일</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">역할</th>
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
                      <RoleBadge role="tester" />
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

          <p className="mt-4 text-center text-[11px] text-gray-400">
            새로고침하면 최신 데이터가 반영됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`flex items-center rounded-lg px-3 py-2 text-sm cursor-default transition-colors ${
        active
          ? "bg-gray-100 text-gray-900 font-medium"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      }`}
    >
      {label}
    </div>
  );
}
