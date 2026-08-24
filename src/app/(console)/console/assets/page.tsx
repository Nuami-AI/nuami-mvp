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
      subtitle="외부 공식자료를 등록·검토한 뒤, 승인·반영된 항목만 AI 지식베이스에 사용합니다."
    >
      <KnowledgeAssetsPanel />
    </AdminShell>
  );
}
