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
      subtitle="기관 공식자료를 올리고 AI 판독·공공데이터 검증 후 소속 학생 가이드에 재사용합니다."
    >
      <KnowledgeManager />
    </AdminShell>
  );
}
