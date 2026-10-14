import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminUnavailable } from "@/components/admin/AdminUnavailable";
import { getSessionFromCookies, listSessionOrganizations } from "@/lib/auth/page-session";
import { isInternalAccount, isSuperAdmin } from "@/lib/auth/access";
import { institutionAdminPath, institutionLogoSrc } from "@/lib/institution/catalog";

export default async function InstitutionAdminIndexPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/admin/login?redirect=/admin");
  if (session.mustChangePassword) redirect("/admin/password");

  const orgs = await listSessionOrganizations(session);
  if (orgs.length === 0 && isInternalAccount(session.role) && !isSuperAdmin(session.email)) {
    redirect("/console/organizations");
  }

  if (orgs.length === 0) {
    return <AdminUnavailable />;
  }

  if (orgs.length === 1) {
    redirect(institutionAdminPath(orgs[0]));
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16 text-sm">
      <div className="mx-auto max-w-lg">
        <h1 className="text-base font-bold text-gray-900">기관을 선택하세요</h1>
        <p className="mt-2 text-gray-500">담당하고 있는 기관만 보여요.</p>

        <div className="mt-6 space-y-2">
          {orgs.map((row) => (
            <Link
              key={row.id}
              href={institutionAdminPath(row)}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300"
            >
              <img
                src={institutionLogoSrc(row.city, row.logoFile ?? row.id)}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 object-contain"
              />
              <span className="min-w-0">
                <p className="font-semibold text-gray-900">{row.nameKo}</p>
                <p className="text-xs text-gray-400">{row.city} · {row.nameEn}</p>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
