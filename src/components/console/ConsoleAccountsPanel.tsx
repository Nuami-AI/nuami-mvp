"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ConsoleAccountRow {
  email: string;
  kind: "org" | "end" | "console";
  orgs: string[];
  status: string;
  provider: string;
  passwordMustChange: boolean;
  createdAt: string;
}

export function ConsoleAccountsPanel({ rows }: { rows: ConsoleAccountRow[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyEmail, setBusyEmail] = useState("");

  async function resetPassword(email: string) {
    if (!window.confirm(`${email} 비밀번호를 1234로 초기화할까요? 다음 로그인에서 변경해야 합니다.`)) return;
    setError("");
    setNotice("");
    setBusyEmail(email);
    const res = await fetch("/api/console/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset", email }),
    });
    const data = (await res.json().catch(() => null)) as { message?: string; email?: string } | null;
    setBusyEmail("");
    if (!res.ok) {
      setError(data?.message ?? "초기화하지 못했습니다.");
      return;
    }
    setNotice(`${data?.email ?? email} 비밀번호를 1234로 초기화했습니다.`);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
      {notice ? <p className="rounded-lg bg-gray-50 px-3 py-2 text-[13px] text-gray-800">{notice}</p> : null}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">이메일</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">구분</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">소속 기관</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">상태</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">로그인</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">가입</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                  계정이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.email}>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.email}</td>
                  <td className="px-4 py-3">
                    <KindBadge kind={row.kind} />
                    {row.passwordMustChange ? (
                      <span className="ml-2 text-[11px] text-amber-700">비번 변경 필요</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{row.orgs.length ? row.orgs.join(", ") : "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{row.status}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{row.provider ? row.provider : "이메일"}</td>
                  <td className="px-4 py-3 text-xs tabular-nums text-gray-500">
                    {new Date(row.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={busyEmail === row.email || row.status !== "ACTIVE"}
                      onClick={() => void resetPassword(row.email)}
                      className="text-xs text-gray-500 hover:text-gray-900 disabled:text-gray-300"
                    >
                      {busyEmail === row.email ? "초기화 중…" : "초기화"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: "org" | "end" | "console" }) {
  if (kind === "org") {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
        기관
      </span>
    );
  }
  if (kind === "console") {
    return (
      <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-800">
        콘솔
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
      엔드유저
    </span>
  );
}
