import AdminShell from "@/components/admin/AdminShell";
import { isSuperAdmin } from "@/lib/auth/access";
import { accountKindOf, healOrgStaffAccountTypes } from "@/lib/auth/accounts";
import { requireConsoleSession } from "@/lib/auth/page-session";
import { getInstitution } from "@/lib/institution/catalog";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ConsoleAccountsPage() {
  const session = await requireConsoleSession();
  if (!isSuperAdmin(session.email)) redirect("/console");
  await healOrgStaffAccountTypes();

  const [rows, members] = await Promise.all([
    prisma.authUser.findMany({
      select: {
        email: true,
        accountType: true,
        status: true,
        provider: true,
        passwordMustChange: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organizationMember.findMany({
      where: { status: "ACTIVE" },
      select: { email: true, organizationId: true },
    }),
  ]);

  const orgsByEmail = new Map<string, string[]>();
  for (const member of members) {
    const name = getInstitution(member.organizationId)?.nameKo ?? member.organizationId;
    const list = orgsByEmail.get(member.email.toLowerCase()) ?? [];
    list.push(name);
    orgsByEmail.set(member.email.toLowerCase(), list);
  }

  return (
    <AdminShell
      email={session.email}
      active="accounts"
      title="전체 계정"
      subtitle="기관 담당자와 이용자를 구분합니다."
    >
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">이메일</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">구분</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">소속 기관</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">상태</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">로그인</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">가입</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                  계정이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const orgs = orgsByEmail.get(row.email.toLowerCase()) ?? [];
                const kind = accountKindOf(row.accountType, orgs.length > 0);
                return (
                  <tr key={row.email}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.email}</td>
                    <td className="px-4 py-3">
                      <KindBadge kind={kind} />
                      {row.passwordMustChange ? (
                        <span className="ml-2 text-[11px] text-amber-700">비번 변경 필요</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{orgs.length ? orgs.join(", ") : "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{row.status}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{row.provider ? row.provider : "이메일"}</td>
                    <td className="px-4 py-3 text-xs tabular-nums text-gray-500">
                      {row.createdAt.toLocaleString("ko-KR")}
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

function KindBadge({ kind }: { kind: "org" | "end" | "console" }) {
  if (kind === "org") {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
        기관
      </span>
    );
  }
  if (kind === "console") {
    return (
      <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-800">
        콘솔
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
      엔드유저
    </span>
  );
}
