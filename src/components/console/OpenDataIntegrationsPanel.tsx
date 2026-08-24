"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { StatusBubble, type StatusTone } from "@/components/ui/status-bubble";
import type { SyncSnapshot } from "@/lib/opendata/sync";
import {
  CATEGORY_LABEL,
  REGION_LABEL,
  SOURCE_TYPE_LABEL,
  STATUS_LABEL,
  type OpenDataCategory,
  type OpenDataRegion,
  type OpenDataStatus,
  type OpenDataStatusRow,
  type Priority,
} from "@/lib/opendata/status";

function formatSyncedAt(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusTone(status: OpenDataStatus): StatusTone {
  if (status === "CONNECTED") return "done";
  if (status === "ERROR") return "danger";
  if (status === "INACTIVE") return "ready";
  return "progress";
}

const PRIORITIES: Array<Priority | "ALL"> = ["ALL", "P0", "P1", "P2"];
const REGIONS: Array<OpenDataRegion | "ALL"> = ["ALL", "NATIONAL", "SEOUL", "BUSAN"];

export function OpenDataIntegrationsPanel({
  rows: initialRows,
  syncSnapshot: initialSnapshot,
  autoSync = false,
}: {
  rows: OpenDataStatusRow[];
  syncSnapshot?: SyncSnapshot;
  autoSync?: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [priority, setPriority] = useState<Priority | "ALL">("ALL");
  const [region, setRegion] = useState<OpenDataRegion | "ALL">("ALL");
  const [category, setCategory] = useState<OpenDataCategory | "ALL">("ALL");
  const autoStarted = useRef(false);

  const categories = useMemo(() => {
    const ids = [...new Set(rows.map((r) => r.category))];
    return ids;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (priority !== "ALL" && row.priority !== priority) return false;
      if (region !== "ALL" && row.region !== region) return false;
      if (category !== "ALL" && row.category !== category) return false;
      return true;
    });
  }, [rows, priority, region, category]);

  const counts = useMemo(() => {
    const byStatus = (s: OpenDataStatus) => rows.filter((r) => r.runtimeStatus === s).length;
    return {
      total: rows.length,
      connected: byStatus("CONNECTED"),
      planned: byStatus("PLANNED"),
      error: byStatus("ERROR"),
      inactive: byStatus("INACTIVE"),
    };
  }, [rows]);

  function runSync(force = false) {
    startTransition(async () => {
      setSyncError(null);
      try {
        const res = await fetch(`/api/console/opendata/sync${force ? "?force=1" : ""}`, {
          method: "POST",
        });
        const data = (await res.json()) as {
          ok?: boolean;
          rows?: OpenDataStatusRow[];
          snapshot?: SyncSnapshot;
          error?: string;
        };
        if (!res.ok || !data.ok || !data.rows) {
          setSyncError(data.error ?? `동기화 실패 (${res.status})`);
          return;
        }
        setRows(data.rows);
        setSnapshot(data.snapshot);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : "동기화 요청 실패");
      }
    });
  }

  useEffect(() => {
    if (!autoSync || autoStarted.current) return;
    autoStarted.current = true;
    runSync(false);
    // mount-once auto sync
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[13px] text-gray-500">
          P0 헬스체크 · 마지막 동기화{" "}
          <span className="font-medium text-gray-700">{formatSyncedAt(snapshot?.syncedAt)}</span>
          {snapshot ? (
            <span className="ml-2 text-gray-400">
              ({snapshot.summary.ok}/{snapshot.summary.total} 성공)
            </span>
          ) : pending ? (
            <span className="ml-2 text-sky-600">동기화 중…</span>
          ) : null}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => runSync(true)}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {pending ? "동기화 중…" : "P0 다시 동기화"}
        </button>
      </div>
      {syncError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
          {syncError}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <SummaryCard label="전체" value={String(counts.total)} />
        <SummaryCard label="연동됨" value={String(counts.connected)} tone="ok" />
        <SummaryCard label="예정" value={String(counts.planned)} />
        <SummaryCard
          label="오류·미설정"
          value={String(counts.error)}
          tone={counts.error ? "warn" : "ok"}
        />
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
        <p className="font-medium">보안 · 등록 방식</p>
        <p className="mt-1 text-amber-900/80">
          API 키는 env/Vercel에만 둡니다. 콘솔에는 변수명·설정 여부·마스킹만 표시합니다.
          새 공공데이터는 <strong>카탈로그에 등록</strong>해야 목록에 나타나며, env만 넣는다고
          자동 추가되지 않습니다. 전국 API는 서울/부산용으로 중복 만들지 않습니다.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <FilterRow label="우선순위">
          {PRIORITIES.map((p) => (
            <Chip key={p} active={priority === p} onClick={() => setPriority(p)}>
              {p === "ALL" ? "전체" : p}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="지역">
          {REGIONS.map((r) => (
            <Chip key={r} active={region === r} onClick={() => setRegion(r)}>
              {r === "ALL" ? "전체" : REGION_LABEL[r]}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="카테고리">
          <Chip active={category === "ALL"} onClick={() => setCategory("ALL")}>
            전체
          </Chip>
          {categories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </FilterRow>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-400">
            조건에 맞는 연동이 없습니다.
          </div>
        ) : (
          filtered.map((row) => (
            <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{row.name}</h3>
                    <StatusBubble tone={statusTone(row.runtimeStatus)}>
                      {STATUS_LABEL[row.runtimeStatus]}
                    </StatusBubble>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {row.priority}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                      {CATEGORY_LABEL[row.category]}
                    </span>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700">
                      {REGION_LABEL[row.region]}
                    </span>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700">
                      {SOURCE_TYPE_LABEL[row.sourceType]}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-gray-500">{row.provider}</p>
                  {row.notes ? (
                    <p className="mt-1 text-[12px] text-gray-400">{row.notes}</p>
                  ) : null}
                </div>
                {row.datasetUrl ? (
                  <a
                    href={row.datasetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-[12px] font-medium text-sky-700 hover:underline"
                  >
                    공식 문서
                  </a>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Meta label="env">
                  <span className="font-mono text-[12px] text-gray-700">{row.envKey ?? "—"}</span>
                </Meta>
                <Meta label="키">
                  <span className="font-mono text-[12px] text-gray-700">
                    {row.publicNote ?? row.maskedKey ?? (row.envKey ? "미설정" : "—")}
                  </span>
                </Meta>
                <Meta label="데이터셋 ID">
                  <span className="font-mono text-[11px] text-gray-500">
                    {row.datasetId ? `data.go.kr/${row.datasetId}` : "—"}
                  </span>
                </Meta>
                <Meta label="마지막 동기화">
                  <span className="text-[12px] text-gray-600">
                    {formatSyncedAt(row.lastSyncedAt)}
                  </span>
                  {row.syncMessage ? (
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {row.syncSampleCount != null ? `${row.syncSampleCount}건 · ` : ""}
                      {row.syncMessage}
                    </p>
                  ) : row.priority === "P0" ? (
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {pending ? "동기화 중…" : "P0 미동기화"}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-gray-400">P1+ · 요청 시 조회</p>
                  )}
                </Meta>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    MVP 활용 위치
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {row.mvpUsage.map((u) => (
                      <span
                        key={u}
                        className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    관련 생활 시나리오
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {row.scenarios.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <p className="text-[12px] text-gray-400">{filtered.length}개 표시 · Catalog → API Module → env → Console</p>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-14 shrink-0 text-[11px] font-medium text-gray-400">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
        active
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          tone === "warn" ? "text-amber-700" : tone === "ok" ? "text-emerald-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
