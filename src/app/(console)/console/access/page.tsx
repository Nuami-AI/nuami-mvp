import AdminShell from "@/components/admin/AdminShell";
import { ConsoleAccessPanel, type ConsoleAccessAccount } from "@/components/console/ConsoleAccessPanel";
import { isSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/auth/access";
import {
  CONSOLE_IP_GLOBAL,
  listConsoleIpPolicies,
  policyForEmail,
} from "@/lib/auth/console-ip";
import { requireSuperAdminSession } from "@/lib/auth/page-session";
import { prisma } from "@/lib/db";
import { getRequestAccessContext } from "@/lib/request-ip";

function serializePolicy(policy: ReturnType<typeof policyForEmail>) {
  return {
    targetEmail: policy.targetEmail,
    mode: policy.mode,
    allowOverseas: policy.allowOverseas,
    allowedIps: policy.allowedIps,
    inherited: policy.inherited,
    updatedBy: policy.updatedBy,
    updatedAt: policy.updatedAt?.toISOString() ?? null,
  };
}

export default async function ConsoleAccessPage() {
  const session = await requireSuperAdminSession();
  const [{ ip, country }, policies, users] = await Promise.all([
    getRequestAccessContext(),
    listConsoleIpPolicies(),
    prisma.authUser.findMany({
      where: { accountType: "INTERNAL" },
      select: { email: true, status: true },
      orderBy: { email: "asc" },
    }),
  ]);

  const global = serializePolicy(policyForEmail(CONSOLE_IP_GLOBAL, policies));
  const accounts: ConsoleAccessAccount[] = users.map((row) => {
    const email = row.email.toLowerCase();
    return {
      email,
      status: row.status,
      locked: isSuperAdmin(email),
      policy: serializePolicy(policyForEmail(email, policies)),
    };
  });

  if (!accounts.some((row) => row.email === SUPER_ADMIN_EMAIL)) {
    accounts.unshift({
      email: SUPER_ADMIN_EMAIL,
      status: "ACTIVE",
      locked: true,
      policy: serializePolicy(policyForEmail(SUPER_ADMIN_EMAIL, policies)),
    });
  }

  return (
    <AdminShell
      email={session.email}
      active="access"
      title="접속 제한"
      subtitle="콘솔 접근자의 IP·해외 접속을 기본 정책으로 묶거나 계정마다 따로 지정합니다. 슈퍼 어드민은 제한되지 않습니다."
    >
      <ConsoleAccessPanel currentIp={ip || "—"} currentCountry={country || "—"} global={global} accounts={accounts} />
    </AdminShell>
  );
}
