import Link from "next/link";
import { redirect } from "next/navigation";

import InstitutionShell from "@/components/admin/InstitutionShell";
import { hasOrgPermission, maskEmail } from "@/lib/auth/access";
import { resolveOrgAccess } from "@/lib/auth/page-session";
import { listActiveEndUsersByOrganization } from "@/lib/auth/tenant";
import { institutionAdminPath } from "@/lib/institution/catalog";
import { getAdminUserDetails } from "@/lib/usage/tracker";

export default async function InstitutionUsersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { session, institution, membershipRole } = await resolveOrgAccess(orgSlug);
  if (!hasOrgPermission(membershipRole, "users.read")) redirect("/admin/denied");

  const memberships = await listActiveEndUsersByOrganization(institution.id);
  const details = await getAdminUserDetails(memberships.map((row) => row.email));
  const byEmail = new Map(details.map((row) => [row.email.toLowerCase(), row]));
  const base = institutionAdminPath(institution);

  return (
    <InstitutionShell
      email={session.email}
      institution={institution}
      active="users"
      showUsers
      title="사용자"
      subtitle="이 기관에 소속된 서비스 이용자만 표시합니다."
    >
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">표시명</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">가입</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">최근 이용</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase">이용 횟수</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {memberships.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">
                  소속 이용자가 없습니다.
                </td>
              </tr>
            ) : (
              memberships.map((row) => {
                const usage = byEmail.get(row.email.toLowerCase());
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`${base}/users/${row.id}`} className="text-sm font-medium text-gray-800">
                        {maskEmail(row.email)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {row.joinedAt.toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {usage?.lastSeenAt ? usage.lastSeenAt.toLocaleDateString("ko-KR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-xs tabular-nums">{usage?.video_ai_use ?? 0}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </InstitutionShell>
  );
}
