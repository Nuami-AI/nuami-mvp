import AdminShell from "@/components/admin/AdminShell";
import { ExpertOpinionsPanel } from "@/components/console/ExpertOpinionsPanel";
import { requireConsoleSession } from "@/lib/auth/page-session";

export default async function ConsoleOpinionsPage() {
  const session = await requireConsoleSession();

  return (
    <AdminShell
      email={session.email}
      active="opinions"
      title="전문가 의견"
      subtitle="받은 자문·인터뷰 의견을 등록합니다."
    >
      <ExpertOpinionsPanel />
    </AdminShell>
  );
}
