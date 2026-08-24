"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ASSET_DOMAIN_LABEL,
  ASSET_DOMAINS,
  ASSET_SOURCE_TYPES,
  ASSET_STATUS_LABEL,
  ASSET_STATUSES,
  PROVIDER_TYPE_LABEL,
  type AssetDomain,
  type AssetSourceType,
  type AssetStatus,
  type ProviderType,
} from "@/lib/console-knowledge/types";

interface ProviderOpt {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface AssetRow {
  id: string;
  title: string;
  domain: string;
  region: string;
  institutionId: string | null;
  sourceType: string;
  contentText: string;
  sourceUrl: string | null;
  status: string;
  version: number;
  reviewMemo: string | null;
  reviewerEmail: string | null;
  publishedAt: string | null;
  provider: { id: string; name: string; type: string };
  _count?: { opinions: number; versions: number };
}

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400";
const labelClass = "mb-1 block text-[12px] font-medium text-gray-500";

const NEXT_ACTIONS: Partial<Record<AssetStatus, AssetStatus[]>> = {
  PENDING_REVIEW: ["APPROVED", "ON_HOLD"],
  APPROVED: ["PUBLISHED", "ON_HOLD"],
  PUBLISHED: ["ON_HOLD", "INACTIVE"],
  ON_HOLD: ["PENDING_REVIEW"],
  INACTIVE: ["PENDING_REVIEW"],
};

export function KnowledgeAssetsPanel() {
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderOpt[]>([]);
  const [rows, setRows] = useState<AssetRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<"" | AssetStatus>("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [providerId, setProviderId] = useState("");
  const [domain, setDomain] = useState<AssetDomain>("stay");
  const [region, setRegion] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [sourceType, setSourceType] = useState<AssetSourceType>("TEXT");
  const [sourceUrl, setSourceUrl] = useState("");
  const [contentText, setContentText] = useState("");
  const [reviewMemo, setReviewMemo] = useState("");

  const activeProviders = useMemo(
    () => providers.filter((p) => p.status === "ACTIVE"),
    [providers],
  );

  async function load() {
    const [pRes, aRes] = await Promise.all([
      fetch("/api/console/knowledge/providers"),
      fetch(
        `/api/console/knowledge/assets${filterStatus ? `?status=${filterStatus}` : ""}`,
      ),
    ]);
    const pBody = (await pRes.json()) as { providers?: ProviderOpt[] };
    const aBody = (await aRes.json()) as { assets?: AssetRow[] };
    setProviders(pBody.providers ?? []);
    setRows(aBody.assets ?? []);
    if (!providerId && (pBody.providers?.length ?? 0) > 0) {
      const first = (pBody.providers ?? []).find((p) => p.status === "ACTIVE");
      if (first) setProviderId(first.id);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  async function create() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/console/knowledge/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        providerId,
        domain,
        region,
        institutionId: institutionId || null,
        sourceType,
        sourceUrl: sourceUrl || null,
        contentText,
      }),
    });
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    setBusy(false);
    if (!res.ok) {
      setError(data?.message ?? "등록 실패");
      return;
    }
    setTitle("");
    setContentText("");
    setSourceUrl("");
    setRegion("");
    setInstitutionId("");
    await load();
    router.refresh();
  }

  async function setStatus(id: string, status: AssetStatus) {
    setError("");
    const res = await fetch(`/api/console/knowledge/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", status, reviewMemo }),
    });
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    if (!res.ok) {
      setError(data?.message ?? "상태 변경 실패");
      return;
    }
    await load();
  }

  async function remove(row: AssetRow) {
    if (!confirm(`「${row.title}」을(를) 삭제할까요?`)) return;
    const res = await fetch(`/api/console/knowledge/assets/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? "삭제 실패");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
        업로드만으로는 AI에 쓰이지 않습니다. <strong>승인 → 반영</strong>까지 완료된 자료만
        서비스 지식베이스에 들어갑니다. 반영본을 수정하면 다시 검토대기로 돌아갑니다.
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">지식자료 등록</h2>
        <p className="mt-1 text-[13px] text-gray-500">
          PDF/문서 본문 붙여넣기, URL, 텍스트를 등록합니다. 상태는 검토대기로 시작합니다.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>제목</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>자료 제공처</label>
            <select
              className={inputClass}
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
            >
              <option value="">선택</option>
              {activeProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({PROVIDER_TYPE_LABEL[p.type as ProviderType] ?? p.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>분야</label>
            <select
              className={inputClass}
              value={domain}
              onChange={(e) => setDomain(e.target.value as AssetDomain)}
            >
              {ASSET_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {ASSET_DOMAIN_LABEL[d]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>적용 지역</label>
            <input className={inputClass} value={region} onChange={(e) => setRegion(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>적용 기관 ID (선택)</label>
            <input
              className={inputClass}
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              placeholder="예: korea-university"
            />
          </div>
          <div>
            <label className={labelClass}>자료 유형</label>
            <select
              className={inputClass}
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as AssetSourceType)}
            >
              {ASSET_SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>원본 출처 URL</label>
            <input
              className={inputClass}
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>본문 / 추출 텍스트</label>
            <textarea
              className="min-h-32 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="공식 안내문·인터뷰 요약·PDF 추출 텍스트"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={!title.trim() || !providerId || !contentText.trim() || busy}
            onClick={() => void create()}
            className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white disabled:bg-gray-300"
          >
            {busy ? "등록 중…" : "검토대기 등록"}
          </button>
          {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[12px] text-gray-500">상태 필터</label>
        <select
          className="h-9 rounded-lg border border-gray-200 px-2 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus((e.target.value || "") as "" | AssetStatus)}
        >
          <option value="">전체</option>
          {ASSET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ASSET_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <input
          className="h-9 flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 text-sm"
          placeholder="검토 메모 (상태 변경 시 저장)"
          value={reviewMemo}
          onChange={(e) => setReviewMemo(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">
            등록된 지식자료가 없습니다.
          </div>
        ) : (
          rows.map((row) => {
            const status = row.status as AssetStatus;
            const actions = NEXT_ACTIONS[status] ?? [];
            return (
              <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{row.title}</h3>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                        {ASSET_STATUS_LABEL[status] ?? status}
                      </span>
                      <span className="text-[11px] text-gray-400">v{row.version}</span>
                    </div>
                    <p className="mt-1 text-[12px] text-gray-500">
                      {row.provider.name} · {ASSET_DOMAIN_LABEL[row.domain as AssetDomain] ?? row.domain}
                      {row.region ? ` · ${row.region}` : ""}
                      {row.institutionId ? ` · ${row.institutionId}` : ""}
                      {" · "}
                      {row.sourceType}
                      {row._count ? ` · 의견 ${row._count.opinions} · 이력 ${row._count.versions}` : ""}
                    </p>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-[13px] text-gray-700">
                      {row.contentText}
                    </p>
                    {row.sourceUrl ? (
                      <a
                        href={row.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-[12px] text-sky-700 hover:underline"
                      >
                        원본 출처
                      </a>
                    ) : null}
                    {row.reviewMemo ? (
                      <p className="mt-2 text-[12px] text-gray-400">검토 메모: {row.reviewMemo}</p>
                    ) : null}
                    <p className="mt-1 font-mono text-[10px] text-gray-300">knowledgeSourceId={row.id}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {actions.map((next) => (
                      <button
                        key={next}
                        type="button"
                        onClick={() => void setStatus(row.id, next)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
                      >
                        → {ASSET_STATUS_LABEL[next]}
                      </button>
                    ))}
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
            );
          })
        )}
      </div>
    </div>
  );
}
