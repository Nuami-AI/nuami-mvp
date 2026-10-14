import Link from "next/link";
import { redirect } from "next/navigation";

import InstitutionShell from "@/components/admin/InstitutionShell";
import { hasOrgPermission, maskEmail } from "@/lib/auth/access";
import { resolveOrgAccess } from "@/lib/auth/page-session";
import { listActiveEndUsersByOrganization } from "@/lib/auth/tenant";
import { formatKstDate } from "@/lib/datetime";
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
      membershipRole={membershipRole}
      active="users"
      showUsers
      title="사용자"
      subtitle="이 기관에 소속된 이용자입니다."
    >
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">표시명</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">가입</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">최근 이용</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">이용 횟수</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {memberships.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  소속 이용자가 없습니다.
                </td>
              </tr>
            ) : (
              memberships.map((row) => {
                const usage = byEmail.get(row.email.toLowerCase());
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`${base}/users/${row.id}`} className="font-medium text-gray-800">
                        {maskEmail(row.email)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-500">
                      {formatKstDate(row.joinedAt)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-500">
                      {formatKstDate(usage?.lastSeenAt)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{usage?.video_ai_use ?? 0}</td>
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
