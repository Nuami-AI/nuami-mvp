import AdminShell from "@/components/admin/AdminShell";
import { OpenDataIntegrationsPanel } from "@/components/console/OpenDataIntegrationsPanel";
import { requireConsoleSession } from "@/lib/auth/page-session";
import { listOpenDataStatus } from "@/lib/opendata/status";
import { getCachedP0Sync } from "@/lib/opendata/sync";

export default async function ConsoleOpenDataPage() {
  const session = await requireConsoleSession();
  // Never block SSR on external API probes — catalog first, sync client-side.
  const cached = getCachedP0Sync();
  const rows = listOpenDataStatus(cached?.results);

  return (
    <AdminShell
      email={session.email}
      active="opendata"
      title="공공데이터 연동현황"
      subtitle="어떤 데이터를 · 어디서 · 서울/부산/전국에 · MVP 어느 카드·시나리오에 쓰는지 한눈에 봅니다."
    >
      <OpenDataIntegrationsPanel rows={rows} syncSnapshot={cached ?? undefined} autoSync />
    </AdminShell>
  );
}
