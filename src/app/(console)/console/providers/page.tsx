import AdminShell from "@/components/admin/AdminShell";
import { KnowledgeProvidersPanel } from "@/components/console/KnowledgeProvidersPanel";
import { requireConsoleSession } from "@/lib/auth/page-session";

export default async function ConsoleProvidersPage() {
  const session = await requireConsoleSession();

  return (
    <AdminShell
      email={session.email}
      active="providers"
      title="자료 제공처"
      subtitle="공공기관·대학·지원기관·파트너·외부 전문가 등 출처를 내부에서만 관리합니다."
    >
      <KnowledgeProvidersPanel />
    </AdminShell>
  );
}
