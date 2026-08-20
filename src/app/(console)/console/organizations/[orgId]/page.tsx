import Link from "next/link";
import { notFound } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { OrgStaffMembersPanel } from "@/components/admin/OrgStaffMembersPanel";
import { requireConsoleSession } from "@/lib/auth/page-session";
import { listVisibleOrgStaff } from "@/lib/auth/issue-org-staff";
import { getInstitution } from "@/lib/institution/catalog";
import { ensureInstitutions } from "@/lib/institution/seed";

export default async function ConsoleOrganizationStaffPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const session = await requireConsoleSession();
  const { orgId } = await params;
  await ensureInstitutions();
  const institution = getInstitution(orgId);
  if (!institution) notFound();

  const members = await listVisibleOrgStaff(institution.id);

  return (
    <AdminShell
      email={session.email}
      active="organizations"
      title={institution.nameKo}
      subtitle={`${institution.city} · ${institution.id} — 기관 담당자 계정 발급`}
    >
      <Link href="/console/organizations" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-800">
        ← 기관 목록
      </Link>
      <OrgStaffMembersPanel
        variant="console"
        organizationId={institution.id}
        actorEmail={session.email}
        members={members.map((row) => ({
          id: row.id,
          email: row.email,
          role: row.role,
          status: row.status,
        }))}
      />
    </AdminShell>
  );
}
