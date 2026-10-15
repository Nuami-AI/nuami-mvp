import Link from "next/link";

import AdminShell from "@/components/admin/AdminShell";
import { requireConsoleSession } from "@/lib/auth/page-session";
import { formatKstDateTime } from "@/lib/datetime";
import {
  getLlmUsageDashboard,
  llmProviderLabel,
  llmTaskLabel,
  type LlmUsageRange,
} from "@/lib/llm/usage";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p> : null}
    </div>
  );
}

function num(value: number): string {
  return value.toLocaleString("ko-KR");
}

const RANGES: { id: LlmUsageRange; label: string }[] = [
  { id: "1", label: "오늘" },
  { id: "7", label: "7일" },
  { id: "30", label: "30일" },
];

export default async function ConsoleLlmUsagePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await requireConsoleSession();
  const params = await searchParams;
  const range: LlmUsageRange = params.days === "1" || params.days === "30" ? params.days : "7";
  const data = await getLlmUsageDashboard(range);

  return (
    <AdminShell
      email={session.email}
      active="llm"
      title="AI 사용량"
      subtitle="OpenAI·Claude 호출은 실제 안내 생성 시에만 기록됩니다. 이 화면은 DB만 조회합니다."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {RANGES.map((item) => (
          <Link
            key={item.id}
            href={`/console/llm?days=${item.id}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              range === item.id
                ? "bg-gray-900 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <p className="text-xs text-gray-400">현황 조회는 토큰을 사용하지 않습니다.</p>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="총 호출" value={num(data.totals.calls)} sub={`성공 ${num(data.totals.ok)}`} />
        <StatCard label="입력 토큰" value={num(data.totals.tokensIn)} />
        <StatCard label="출력 토큰" value={num(data.totals.tokensOut)} />
        <StatCard label="합계 토큰" value={num(data.totals.tokensIn + data.totals.tokensOut)} />
      </div>

      <div className="mb-7 grid grid-cols-1 gap-3 md:grid-cols-2">
        {data.byProvider.map((row) => (
          <div key={row.provider} className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            <p className="text-xs font-medium text-gray-400">{row.label}</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{num(row.calls)}회</p>
            <p className="mt-1 tabular-nums text-xs text-gray-500">
              입력 {num(row.tokensIn)} · 출력 {num(row.tokensOut)} · 합계 {num(row.tokensIn + row.tokensOut)}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">성공 {num(row.ok)}</p>
          </div>
        ))}
      </div>

      {data.byTask.length > 0 ? (
        <div className="mb-7 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="admin-scroll">
          <table className="admin-table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">작업</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">호출</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">입력 토큰</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">출력 토큰</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.byTask.map((row) => (
                <tr key={row.task}>
                  <td className="px-4 py-3 font-medium text-gray-800">{row.label}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{num(row.calls)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{num(row.tokensIn)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{num(row.tokensOut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="admin-scroll">
        <table className="admin-table">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">시간</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">제공자</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">모델</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">작업</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">입력</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">출력</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">결과</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.recent.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  아직 기록된 AI 호출이 없습니다. 안내를 생성하면 여기에 쌓입니다.
                </td>
              </tr>
            ) : (
              data.recent.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-500">
                    {formatKstDateTime(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{llmProviderLabel(row.provider)}</td>
                  <td className="px-4 py-3 text-gray-500">{row.model}</td>
                  <td className="px-4 py-3 text-gray-700">{llmTaskLabel(row.task)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{num(row.tokensIn)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{num(row.tokensOut)}</td>
                  <td className="px-4 py-3 text-gray-500">{row.ok ? "성공" : "실패"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </AdminShell>
  );
}
