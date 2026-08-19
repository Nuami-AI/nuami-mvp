"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IssueOrgStaffForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ORG_ADMIN");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<{ email: string; tempPassword: string } | null>(null);

  async function submit() {
    setBusy(true);
    setError("");
    setIssued(null);
    const res = await fetch("/api/console/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, email, role }),
    });
    const data = (await res.json().catch(() => null)) as {
      message?: string;
      email?: string;
      tempPassword?: string;
    } | null;
    setBusy(false);
    if (!res.ok) {
      setError(data?.message ?? "발급하지 못했습니다.");
      return;
    }
    setIssued({ email: data?.email ?? email, tempPassword: data?.tempPassword ?? "1234" });
    setEmail("");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900">기관 계정 발급</h2>
      <p className="mt-1 text-[13px] text-gray-500">
        담당자 이메일을 넣으면 AuthUser + 기관 멤버십이 만들어집니다. 임시 비밀번호는 항상 <span className="font-mono">1234</span>입니다. 기관이 로그인하면 바로 변경합니다.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          placeholder="담당자 이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        >
          <option value="ORG_ADMIN">ORG_ADMIN</option>
          <option value="ORG_OWNER">ORG_OWNER</option>
          <option value="ORG_EDITOR">ORG_EDITOR</option>
          <option value="ORG_VIEWER">ORG_VIEWER</option>
        </select>
        <button
          type="button"
          disabled={!email.trim() || busy}
          onClick={() => void submit()}
          className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white disabled:bg-gray-300"
        >
          {busy ? "발급 중…" : "발급"}
        </button>
      </div>
      {error ? <p className="mt-2 text-[13px] text-red-600">{error}</p> : null}
      {issued ? (
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-[13px] text-gray-800">
          발급됨: <span className="font-medium">{issued.email}</span>
          {" · "}임시 비밀번호 <span className="font-mono font-semibold">{issued.tempPassword}</span>
          {" · "}안내 후 기관 로그인(`/admin/login`)
        </p>
      ) : null}
    </div>
  );
}
