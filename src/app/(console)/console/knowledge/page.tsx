import AdminShell from "@/components/admin/AdminShell";
import KnowledgeManager from "@/components/admin/KnowledgeManager";
import { requireConsoleSession } from "@/lib/auth/page-session";

export default async function ConsoleKnowledgePage() {
  const session = await requireConsoleSession();

  return (
    <AdminShell
      email={session.email}
      active="knowledge"
      title="자료 검수"
      subtitle="기관에서 올린 공식자료를 검수합니다. 외부 제공 지식은 「지식자료」 메뉴를 사용하세요."
    >
      <KnowledgeManager />
    </AdminShell>
  );
}
