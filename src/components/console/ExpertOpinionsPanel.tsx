"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ASSET_DOMAIN_LABEL, ASSET_DOMAINS, type AssetDomain } from "@/lib/console-knowledge/types";

interface AssetOpt {
  id: string;
  title: string;
  status: string;
}

interface OpinionRow {
  id: string;
  expertName: string;
  affiliation: string;
  domain: string;
  assetId: string | null;
  opinion: string;
  receivedAt: string;
  applied: boolean;
  internalMemo: string | null;
  asset: { id: string; title: string; status: string } | null;
}

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400";
const labelClass = "mb-1 block text-[12px] font-medium text-gray-500";

export function ExpertOpinionsPanel() {
  const router = useRouter();
  const [rows, setRows] = useState<OpinionRow[]>([]);
  const [assets, setAssets] = useState<AssetOpt[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [expertName, setExpertName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [domain, setDomain] = useState<AssetDomain | "">("");
  const [assetId, setAssetId] = useState("");
  const [opinion, setOpinion] = useState("");
  const [receivedAt, setReceivedAt] = useState("");
  const [internalMemo, setInternalMemo] = useState("");

  async function load() {
    const [oRes, aRes] = await Promise.all([
      fetch("/api/console/knowledge/opinions"),
      fetch("/api/console/knowledge/assets"),
    ]);
    const oBody = (await oRes.json()) as { opinions?: OpinionRow[] };
    const aBody = (await aRes.json()) as { assets?: AssetOpt[] };
    setRows(oBody.opinions ?? []);
    setAssets(aBody.assets ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/console/knowledge/opinions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expertName,
        affiliation,
        domain,
        assetId: assetId || null,
        opinion,
        receivedAt: receivedAt || undefined,
        internalMemo: internalMemo || null,
      }),
    });
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    setBusy(false);
    if (!res.ok) {
      setError(data?.message ?? "등록 실패");
      return;
    }
    setExpertName("");
    setAffiliation("");
    setDomain("");
    setAssetId("");
    setOpinion("");
    setReceivedAt("");
    setInternalMemo("");
    await load();
    router.refresh();
  }

  async function toggleApplied(row: OpinionRow) {
    const res = await fetch(`/api/console/knowledge/opinions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applied: !row.applied }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? "반영 여부 변경 실패");
      return;
    }
    await load();
  }

  async function remove(row: OpinionRow) {
    if (!confirm(`${row.expertName} 의견을 삭제할까요?`)) return;
    const res = await fetch(`/api/console/knowledge/opinions/${row.id}`, { method: "DELETE" });
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
        <h2 className="text-sm font-semibold text-gray-900">전문가 의견 등록</h2>
        <p className="mt-1 text-[13px] text-gray-500">
          자문·인터뷰·이메일로 받은 의견을 내부 관리자가 대행 등록합니다. 전문가용 로그인은 없습니다.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>전문가명</label>
            <input className={inputClass} value={expertName} onChange={(e) => setExpertName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>소속</label>
            <input className={inputClass} value={affiliation} onChange={(e) => setAffiliation(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>관련 분야</label>
            <select
              className={inputClass}
              value={domain}
              onChange={(e) => setDomain(e.target.value as AssetDomain | "")}
            >
              <option value="">선택</option>
              {ASSET_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {ASSET_DOMAIN_LABEL[d]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>관련 자료</label>
            <select className={inputClass} value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value="">없음</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.status})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>받은 날짜</label>
            <input
              type="date"
              className={inputClass}
              value={receivedAt}
              onChange={(e) => setReceivedAt(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>검토 의견</label>
            <textarea
              className="min-h-28 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>내부 메모</label>
            <input className={inputClass} value={internalMemo} onChange={(e) => setInternalMemo(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={!expertName.trim() || !opinion.trim() || busy}
            onClick={() => void create()}
            className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white disabled:bg-gray-300"
          >
            {busy ? "등록 중…" : "의견 등록"}
          </button>
          {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
        </div>
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">
            등록된 전문가 의견이 없습니다.
          </div>
        ) : (
          rows.map((row) => (
            <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{row.expertName}</h3>
                    {row.affiliation ? (
                      <span className="text-[12px] text-gray-500">{row.affiliation}</span>
                    ) : null}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        row.applied ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {row.applied ? "내부 반영" : "미반영"}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-gray-500">
                    {row.domain
                      ? ASSET_DOMAIN_LABEL[row.domain as AssetDomain] ?? row.domain
                      : "분야 미지정"}
                    {" · "}
                    {new Date(row.receivedAt).toLocaleDateString("ko-KR")}
                    {row.asset ? ` · 자료: ${row.asset.title}` : ""}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] text-gray-800">{row.opinion}</p>
                  {row.internalMemo ? (
                    <p className="mt-2 text-[12px] text-gray-400">내부 메모: {row.internalMemo}</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => void toggleApplied(row)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {row.applied ? "미반영으로" : "반영 완료"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(row)}
                    className="text-[12px] text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
