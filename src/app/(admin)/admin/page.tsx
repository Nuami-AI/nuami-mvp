import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromCookies, listSessionOrganizations } from "@/lib/auth/page-session";
import { isInternalAccount, isSuperAdmin } from "@/lib/auth/access";
import { institutionAdminPath } from "@/lib/institution/catalog";

export default async function InstitutionAdminIndexPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/admin/login?redirect=/admin");
  if (session.mustChangePassword) redirect("/admin/password");
  if (isInternalAccount(session.role) && !isSuperAdmin(session.email)) {
    redirect("/console/organizations");
  }

  const orgs = await listSessionOrganizations(session);

  if (orgs.length === 1) {
    redirect(institutionAdminPath(orgs[0]));
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Institution Admin</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">기관을 선택하세요</h1>
        <p className="mt-2 text-sm text-gray-500">
          소속된 기관만 보입니다. URL을 바꿔도 다른 기관 데이터에는 접근할 수 없습니다.
        </p>

        <div className="mt-6 space-y-2">
          {orgs.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
              접근 권한이 없습니다.
            </p>
          ) : (
            orgs.map((row) => (
              <Link
                key={row.id}
                href={institutionAdminPath(row)}
                className="block rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300"
              >
                <p className="text-sm font-semibold text-gray-900">{row.nameKo}</p>
                <p className="text-[12px] text-gray-400">{row.city} · {row.nameEn}</p>
              </Link>
            ))
          )}
        </div>

        <Link href="/" className="mt-8 inline-block text-sm text-gray-400">
          사용자 앱으로
        </Link>
      </div>
    </div>
  );
}
