"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { SUPER_ADMIN_EMAIL } from "@/lib/auth/access";

interface OperatorRow {
  email: string;
  createdAt: string;
  passwordMustChange: boolean;
}

export function ConsoleOperatorsPanel({
  operators,
}: {
  operators: OperatorRow[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<{ email: string; tempPassword: string } | null>(null);

  async function add() {
    setBusy(true);
    setError("");
    setIssued(null);
    const res = await fetch("/api/console/operators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json().catch(() => null)) as {
      message?: string;
      email?: string;
      tempPassword?: string;
    } | null;
    setBusy(false);
    if (!res.ok) {
      setError(data?.message ?? "추가하지 못했습니다.");
      return;
    }
    setIssued({ email: data?.email ?? email, tempPassword: data?.tempPassword ?? "1234" });
    setEmail("");
    router.refresh();
  }

  async function revoke(target: string) {
    if (!confirm(`${target} 콘솔 권한을 회수할까요?`)) return;
    const res = await fetch("/api/console/operators", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: target }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? "회수하지 못했습니다.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">콘솔 접근자 추가</h2>
        <p className="mt-1 text-[13px] text-gray-500">
          {SUPER_ADMIN_EMAIL}만 모든 권한(콘솔+기관 어드민)이 있습니다. 여기서 추가한 계정은{" "}
          <span className="font-medium">console.nuami.kr만</span> 들어올 수 있습니다.
          새 계정의 임시 비밀번호는 <span className="font-mono">1234</span>이며 첫 로그인에서 바꿉니다.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            placeholder="운영자 이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm"
          />
          <button
            type="button"
            disabled={!email.trim() || busy}
            onClick={() => void add()}
            className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white disabled:bg-gray-300"
          >
            {busy ? "추가 중…" : "콘솔 권한 부여"}
          </button>
        </div>
        {error ? <p className="mt-2 text-[13px] text-red-600">{error}</p> : null}
        {issued ? (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-[13px] text-gray-800">
            추가됨: <span className="font-medium">{issued.email}</span>
            {" · "}임시 비밀번호 <span className="font-mono font-semibold">{issued.tempPassword}</span>
            {" · "}console.nuami.kr/login
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">이메일</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">구분</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {operators.map((row) => {
              const superAdmin = row.email.toLowerCase() === SUPER_ADMIN_EMAIL;
              return (
                <tr key={row.email}>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.email}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {superAdmin ? "슈퍼 어드민 (전체)" : "콘솔만"}
                    {row.passwordMustChange ? " · 비밀번호 변경 필요" : ""}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {superAdmin ? null : (
                      <button
                        type="button"
                        onClick={() => void revoke(row.email)}
                        className="text-xs text-gray-500 hover:text-red-600"
                      >
                        회수
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
