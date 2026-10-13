import AdminShell from "@/components/admin/AdminShell";
import { ConsoleAccountsPanel } from "@/components/console/ConsoleAccountsPanel";
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

  const accounts = rows.map((row) => {
    const orgs = orgsByEmail.get(row.email.toLowerCase()) ?? [];
    return {
      email: row.email,
      kind: accountKindOf(row.accountType, orgs.length > 0),
      orgs,
      status: row.status,
      provider: row.provider ?? "",
      passwordMustChange: row.passwordMustChange,
      createdAt: row.createdAt.toISOString(),
    };
  });

  return (
    <AdminShell
      email={session.email}
      active="accounts"
      title="전체 계정"
      subtitle="기관 담당자와 이용자를 구분합니다. 비밀번호는 1234로 초기화할 수 있습니다."
    >
      <ConsoleAccountsPanel rows={accounts} />
    </AdminShell>
  );
}
