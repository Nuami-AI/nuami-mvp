import AdminShell from "@/components/admin/AdminShell";
import { ConsoleAccountsPanel } from "@/components/console/ConsoleAccountsPanel";
import { isSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/auth/access";
import { accountKindOf, healOrgStaffAccountTypes, kindsOfAccount } from "@/lib/auth/accounts";
import { requireConsoleSession } from "@/lib/auth/page-session";
import { INSTITUTION_CATALOG, getInstitution, institutionLogoSrc } from "@/lib/institution/catalog";
import { prisma } from "@/lib/db";
import { defaultCreditsLimit, resolveCreditsLimit } from "@/lib/usage/tracker";
import { redirect } from "next/navigation";

export default async function ConsoleAccountsPage() {
  const session = await requireConsoleSession();
  if (!isSuperAdmin(session.email)) redirect("/console");
  await healOrgStaffAccountTypes();

  const [rows, members, usage] = await Promise.all([
    prisma.authUser.findMany({
      select: {
        email: true,
        accountType: true,
        status: true,
        provider: true,
        passwordMustChange: true,
        isTest: true,
        creditsLimit: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organizationMember.findMany({
      where: { status: "ACTIVE" },
      select: { email: true, organizationId: true },
    }),
    prisma.usageEvent.groupBy({
      by: ["userEmail"],
      where: { action: "video_ai_use" },
      _count: { id: true },
    }),
  ]);

  const orgsByEmail = new Map<string, Array<{ id: string; nameKo: string; logoSrc: string }>>();
  const orgIdByEmail = new Map<string, string>();
  for (const member of members) {
    const org = getInstitution(member.organizationId);
    const list = orgsByEmail.get(member.email.toLowerCase()) ?? [];
    list.push({
      id: member.organizationId,
      nameKo: org?.nameKo ?? member.organizationId,
      logoSrc: org ? institutionLogoSrc(org.city, org.logoFile ?? org.id) : "",
    });
    orgsByEmail.set(member.email.toLowerCase(), list);
    if (!orgIdByEmail.has(member.email.toLowerCase())) {
      orgIdByEmail.set(member.email.toLowerCase(), member.organizationId);
    }
  }
  const usedByEmail = new Map(usage.map((row) => [row.userEmail.toLowerCase(), row._count.id]));

  const accounts = rows.map((row) => {
    const key = row.email.toLowerCase();
    const orgs = orgsByEmail.get(key) ?? [];
    const accountType = (row.accountType === "ORG_STAFF" || row.accountType === "INTERNAL"
      ? row.accountType
      : "END_USER") as "END_USER" | "ORG_STAFF" | "INTERNAL";
    return {
      email: row.email,
      kind: accountKindOf(row.accountType, orgs.length > 0),
      kinds: kindsOfAccount(row.accountType, orgs.length > 0),
      accountType,
      orgs,
      organizationId: orgIdByEmail.get(key) ?? "",
      status: row.status,
      provider: row.provider ?? "",
      passwordMustChange: row.passwordMustChange,
      isTest: row.isTest,
      creditsUsed: usedByEmail.get(key) ?? 0,
      creditsLimit: resolveCreditsLimit(row.creditsLimit),
      createdAt: row.createdAt.toISOString(),
    };
  });

  return (
    <AdminShell
      email={session.email}
      active="accounts"
      title="전체 계정"
      subtitle="슈퍼 어드민만 계정을 추가·수정·삭제하고 크레딧을 바꿀 수 있습니다."
    >
      <ConsoleAccountsPanel
        rows={accounts}
        actorEmail={session.email}
        protectedEmail={SUPER_ADMIN_EMAIL}
        institutions={INSTITUTION_CATALOG.map((row) => ({ id: row.id, nameKo: row.nameKo }))}
        defaultCredits={defaultCreditsLimit()}
      />
    </AdminShell>
  );
}
