"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  PROVIDER_TYPE_LABEL,
  PROVIDER_TYPES,
  type ProviderType,
} from "@/lib/console-knowledge/types";

interface ProviderRow {
  id: string;
  name: string;
  type: string;
  domain: string;
  region: string;
  description: string | null;
  status: string;
}

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400";
const labelClass = "mb-1 block text-[12px] font-medium text-gray-500";

export function KnowledgeProvidersPanel() {
  const router = useRouter();
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<ProviderType>("PUBLIC_AGENCY");
  const [domain, setDomain] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/console/knowledge/providers");
    const body = (await res.json()) as { providers?: ProviderRow[] };
    setRows(body.providers ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/console/knowledge/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, domain, region, description }),
    });
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    setBusy(false);
    if (!res.ok) {
      setError(data?.message ?? "등록에 실패했습니다.");
      return;
    }
    setName("");
    setDomain("");
    setRegion("");
    setDescription("");
    await load();
    router.refresh();
  }

  async function toggleStatus(row: ProviderRow) {
    const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch(`/api/console/knowledge/providers/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? "상태 변경 실패");
      return;
    }
    await load();
  }

  async function remove(row: ProviderRow) {
    if (!confirm(`「${row.name}」을(를) 삭제할까요?`)) return;
    const res = await fetch(`/api/console/knowledge/providers/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? "삭제 실패");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">제공처 등록</h2>
        <p className="mt-1 text-[13px] text-gray-500">
          외부 기관·파트너·전문가에게 계정을 주지 않고, 내부에서 제공처만 관리합니다.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>제공처명</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>유형</label>
            <select
              className={inputClass}
              value={type}
              onChange={(e) => setType(e.target.value as ProviderType)}
            >
              {PROVIDER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROVIDER_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>담당 분야</label>
            <input className={inputClass} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="예: 체류·비자" />
          </div>
          <div>
            <label className={labelClass}>지역</label>
            <input className={inputClass} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="예: 전국 / 부산" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>설명</label>
            <textarea
              className="min-h-20 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={!name.trim() || busy}
            onClick={() => void create()}
            className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white disabled:bg-gray-300"
          >
            {busy ? "등록 중…" : "제공처 추가"}
          </button>
          {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-gray-400">제공처</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-gray-400">유형</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-gray-400">분야·지역</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-gray-400">상태</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase text-gray-400" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  등록된 제공처가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{row.name}</p>
                    {row.description ? (
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-gray-400">{row.description}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {PROVIDER_TYPE_LABEL[row.type as ProviderType] ?? row.type}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {[row.domain, row.region].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        row.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {row.status === "ACTIVE" ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => void toggleStatus(row)}
                      className="text-[12px] text-gray-500 hover:text-gray-800"
                    >
                      {row.status === "ACTIVE" ? "비활성" : "활성"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(row)}
                      className="text-[12px] text-red-500 hover:text-red-700"
                    >
                      삭제
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
