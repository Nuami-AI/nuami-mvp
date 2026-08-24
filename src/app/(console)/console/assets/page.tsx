import AdminShell from "@/components/admin/AdminShell";
import { KnowledgeAssetsPanel } from "@/components/console/KnowledgeAssetsPanel";
import { requireConsoleSession } from "@/lib/auth/page-session";

export default async function ConsoleAssetsPage() {
  const session = await requireConsoleSession();

  return (
    <AdminShell
      email={session.email}
      active="assets"
      title="지식자료"
      subtitle="검토가 끝난 자료만 지식베이스에 반영합니다."
    >
      <KnowledgeAssetsPanel />
    </AdminShell>
  );
}
