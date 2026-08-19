import AdminShell from "@/components/admin/AdminShell";
import { ConsoleOperatorsPanel } from "@/components/console/ConsoleOperatorsPanel";
import { isSuperAdmin } from "@/lib/auth/access";
import { listConsoleOperators } from "@/lib/auth/issue-console-operator";
import { requireConsoleSession } from "@/lib/auth/page-session";
import { redirect } from "next/navigation";

export default async function ConsoleOperatorsPage() {
  const session = await requireConsoleSession();
  if (!isSuperAdmin(session.email)) redirect("/console");
  const operators = await listConsoleOperators();

  return (
    <AdminShell
      email={session.email}
      active="operators"
      showOperators
      title="콘솔 접근자"
      subtitle="admin@nuami.kr만 전체 권한입니다. 나머지는 console만 추가하세요."
    >
      <ConsoleOperatorsPanel
        operators={operators.map((row) => ({
          email: row.email,
          createdAt: row.createdAt.toISOString(),
          passwordMustChange: row.passwordMustChange,
        }))}
      />
    </AdminShell>
  );
}
