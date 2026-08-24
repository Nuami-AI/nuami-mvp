import AdminShell from "@/components/admin/AdminShell";
import { ConsoleOrganizationsTable } from "@/components/console/ConsoleOrganizationsTable";
import { requireConsoleSession } from "@/lib/auth/page-session";
import { prisma } from "@/lib/db";
import {
  INSTITUTION_CATALOG,
  organizationSlugOf,
} from "@/lib/institution/catalog";
import { ensureInstitutions } from "@/lib/institution/seed";

export default async function ConsoleOrganizationsPage() {
  const session = await requireConsoleSession();
  await ensureInstitutions();

  const [docCounts, knowledgeCounts, memberCounts] = await Promise.all([
    prisma.institutionDocument.groupBy({ by: ["institutionId"], _count: { _all: true } }),
    prisma.institutionKnowledge.groupBy({ by: ["institutionId"], _count: { _all: true } }),
    prisma.organizationMember.groupBy({ by: ["organizationId"], _count: { _all: true } }),
  ]);

  const docs = Object.fromEntries(docCounts.map((row) => [row.institutionId, row._count._all]));
  const knowledge = Object.fromEntries(
    knowledgeCounts.map((row) => [row.institutionId, row._count._all]),
  );
  const members = Object.fromEntries(
    memberCounts.map((row) => [row.organizationId, row._count._all]),
  );

  const rows = INSTITUTION_CATALOG.map((row) => ({
    id: row.id,
    nameKo: row.nameKo,
    city: row.city,
    slug: organizationSlugOf(row),
    documentCount: docs[row.id] ?? 0,
    knowledgeCount: knowledge[row.id] ?? 0,
    memberCount: members[row.id] ?? 0,
  }));

  return (
    <AdminShell
      email={session.email}
      active="organizations"
      title="기관"
      subtitle="광역자치단체별로 기관을 확인합니다."
    >
      <ConsoleOrganizationsTable rows={rows} />
    </AdminShell>
  );
}
