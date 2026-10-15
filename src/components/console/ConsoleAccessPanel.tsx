"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Toast } from "@/components/ui/toast";
import { formatKstDateTime } from "@/lib/datetime";

export type ConsoleIpMode = "allow_all" | "allowlist";

export interface ConsoleIpPolicyForm {
  targetEmail: string;
  mode: ConsoleIpMode;
  allowOverseas: boolean;
  allowedIps: string[];
  inherited: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface ConsoleAccessAccount {
  email: string;
  status: string;
  locked: boolean;
  policy: ConsoleIpPolicyForm;
}

function ipsToText(ips: string[]): string {
  return ips.join("\n");
}

function PolicyFields({
  mode,
  allowOverseas,
  ipsText,
  onMode,
  onOverseas,
  onIps,
}: {
  mode: ConsoleIpMode;
  allowOverseas: boolean;
  ipsText: string;
  onMode: (mode: ConsoleIpMode) => void;
  onOverseas: (value: boolean) => void;
  onIps: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium text-gray-400">IP 정책</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "allow_all", label: "모든 IP 허용" },
              { id: "allowlist", label: "지정 IP만 허용" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onMode(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                mode === item.id
                  ? "bg-gray-900 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <input
          type="checkbox"
          checked={allowOverseas}
          onChange={(event) => onOverseas(event.target.checked)}
          className="mt-0.5 size-4 rounded border-gray-300"
        />
        <span>
          <span className="block text-sm font-medium text-gray-800">해외 접속 허용</span>
          <span className="mt-0.5 block text-xs text-gray-500">
            끄면 한국(KR) 외 국가 코드는 차단됩니다. 로컬·사설망은 항상 허용됩니다.
          </span>
        </span>
      </label>

      {mode === "allowlist" ? (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400" htmlFor="allowed-ips">
            허용 IP / CIDR
          </label>
          <textarea
            id="allowed-ips"
            value={ipsText}
            onChange={(event) => onIps(event.target.value)}
            rows={5}
            placeholder={"203.0.113.10\n10.0.0.0/8"}
            className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm text-gray-800 outline-none focus:border-gray-400"
          />
          <p className="mt-1 text-[11px] text-gray-400">줄바꿈 또는 쉼표로 구분합니다. 로컬호스트는 항상 허용됩니다.</p>
        </div>
      ) : null}
    </div>
  );
}

function summary(policy: ConsoleIpPolicyForm): string {
  const mode = policy.mode === "allowlist" ? `지정 IP ${policy.allowedIps.length}개` : "모든 IP";
  const overseas = policy.allowOverseas ? "해외 허용" : "해외 차단";
  return `${mode} · ${overseas}`;
}

export function ConsoleAccessPanel({
  currentIp,
  currentCountry,
  global,
  accounts,
}: {
  currentIp: string;
  currentCountry: string;
  global: ConsoleIpPolicyForm;
  accounts: ConsoleAccessAccount[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ConsoleIpMode>(global.mode);
  const [allowOverseas, setAllowOverseas] = useState(global.allowOverseas);
  const [ipsText, setIpsText] = useState(ipsToText(global.allowedIps));
  const [editing, setEditing] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<ConsoleIpMode>("allow_all");
  const [editOverseas, setEditOverseas] = useState(true);
  const [editIps, setEditIps] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submit(body: Record<string, unknown>, okMessage: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/console/access", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        setError(data?.message || "저장에 실패했습니다.");
        return;
      }
      setNotice(okMessage);
      setEditing(null);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function openEdit(account: ConsoleAccessAccount) {
    setEditing(account.email);
    setEditMode(account.policy.inherited ? mode : account.policy.mode);
    setEditOverseas(account.policy.inherited ? allowOverseas : account.policy.allowOverseas);
    setEditIps(ipsToText(account.policy.inherited ? ipsText.split(/[\s,]+/).filter(Boolean) : account.policy.allowedIps));
  }

  return (
    <div className="space-y-6">
      <Toast message={notice} variant="success" onDismiss={() => setNotice("")} />
      {error ? <Toast message={error} variant="danger" onDismiss={() => setError("")} /> : null}

      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600">
        현재 접속 IP <span className="font-semibold tabular-nums text-gray-900">{currentIp}</span>
        <span className="mx-2 text-gray-300">·</span>
        국가 <span className="font-semibold text-gray-900">{currentCountry}</span>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">기본 정책 (전체)</h2>
          <p className="mt-1 text-xs text-gray-500">
            개별 설정이 없는 콘솔 계정에 적용됩니다.
            {global.updatedAt ? ` 마지막 변경 ${formatKstDateTime(global.updatedAt)}` : ""}
            {global.updatedBy ? ` · ${global.updatedBy}` : ""}
          </p>
        </div>
        <PolicyFields
          mode={mode}
          allowOverseas={allowOverseas}
          ipsText={ipsText}
          onMode={setMode}
          onOverseas={setAllowOverseas}
          onIps={setIpsText}
        />
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              submit(
                {
                  action: "save",
                  targetEmail: "*",
                  mode,
                  allowOverseas,
                  allowedIps: ipsText,
                },
                "기본 정책을 저장했습니다.",
              )
            }
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            기본 정책 저장
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              submit(
                {
                  action: "apply_all",
                  mode,
                  allowOverseas,
                  allowedIps: ipsText,
                },
                "모든 콘솔 계정에 기본 정책을 적용했습니다.",
              )
            }
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            전체 계정에 동일 적용
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">계정별 부여</h2>
          <p className="mt-1 text-xs text-gray-500">콘솔 권한이 있는 계정만 표시됩니다. 슈퍼 어드민은 항상 접속됩니다.</p>
        </div>
        <div className="admin-scroll">
          <table className="admin-table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">계정</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">적용</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">정책</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.map((account) => (
                <tr key={account.email} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{account.email}</p>
                    <p className="text-[11px] text-gray-400">
                      {account.locked ? "슈퍼 어드민" : account.status === "ACTIVE" ? "활성" : "비활성"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {account.locked ? "제한 없음" : account.policy.inherited ? "기본 정책" : "개별 설정"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {account.locked ? "항상 허용" : summary(account.policy)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {account.locked ? (
                      <span className="text-xs text-gray-400">변경 불가</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => openEdit(account)}
                          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          개별 부여
                        </button>
                        {!account.policy.inherited ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              submit(
                                { action: "inherit", targetEmail: account.email },
                                `${account.email}을 기본 정책으로 되돌렸습니다.`,
                              )
                            }
                            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            기본 따름
                          </button>
                        ) : null}
                      </div>
                    )}
                    {editing === account.email ? (
                      <div className="mt-3 min-w-65 rounded-lg border border-gray-200 bg-gray-50 p-3 text-left">
                        <PolicyFields
                          mode={editMode}
                          allowOverseas={editOverseas}
                          ipsText={editIps}
                          onMode={setEditMode}
                          onOverseas={setEditOverseas}
                          onIps={setEditIps}
                        />
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-lg px-2.5 py-1 text-xs text-gray-500"
                            onClick={() => setEditing(null)}
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              submit(
                                {
                                  action: "save",
                                  targetEmail: account.email,
                                  mode: editMode,
                                  allowOverseas: editOverseas,
                                  allowedIps: editIps,
                                },
                                `${account.email}에 개별 정책을 저장했습니다.`,
                              )
                            }
                            className="rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-medium text-white"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
