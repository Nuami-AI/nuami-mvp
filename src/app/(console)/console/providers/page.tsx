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
      subtitle="지식자료의 출처를 관리합니다."
    >
      <KnowledgeProvidersPanel />
    </AdminShell>
  );
}
