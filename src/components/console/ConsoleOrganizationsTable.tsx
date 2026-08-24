"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  normalizeRegionId,
  REGION_DIVISIONS,
  regionOf,
} from "@/lib/institution/regions";

export interface OrgListRow {
  id: string;
  nameKo: string;
  city: string;
  slug: string;
  documentCount: number;
  knowledgeCount: number;
  memberCount: number;
}

type SortKey = "name" | "docs" | "knowledge" | "members";
type SortDir = "asc" | "desc";
type RegionFilter = "전체" | string;

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <span className="ml-1 inline-block text-[10px] text-gray-300" aria-hidden>
        ↕
      </span>
    );
  }
  return (
    <span className="ml-1 inline-block text-[10px] text-gray-700" aria-hidden>
      {dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

function SortHeader({
  label,
  column,
  sortKey,
  sortDir,
  align = "left",
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  align?: "left" | "center" | "right";
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === column;
  const thAlign =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  const alignClass =
    align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
  return (
    <th className={`px-4 py-3 ${thAlign}`}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex w-full items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${alignClass} ${
          active ? "text-gray-800" : "text-gray-400 hover:text-gray-600"
        }`}
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        {label}
        <SortIcon active={active} dir={sortDir} />
      </button>
    </th>
  );
}

export function ConsoleOrganizationsTable({ rows }: { rows: OrgListRow[] }) {
  const [city, setCity] = useState<RegionFilter>("전체");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const countsByRegion = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const id = normalizeRegionId(row.city);
      if (!id) continue;
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  function onSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "name" ? "asc" : "desc");
  }

  const filtered = useMemo(() => {
    const list =
      city === "전체"
        ? rows
        : rows.filter((r) => normalizeRegionId(r.city) === city);
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortKey === "name") {
        return a.nameKo.localeCompare(b.nameKo, "ko") * dir;
      }
      const av =
        sortKey === "docs"
          ? a.documentCount
          : sortKey === "knowledge"
            ? a.knowledgeCount
            : a.memberCount;
      const bv =
        sortKey === "docs"
          ? b.documentCount
          : sortKey === "knowledge"
            ? b.knowledgeCount
            : b.memberCount;
      if (av === bv) return a.nameKo.localeCompare(b.nameKo, "ko");
      return (av - bv) * dir;
    });
  }, [rows, city, sortKey, sortDir]);

  const selectedRegion = city === "전체" ? undefined : regionOf(city);
  const isComingSoon = city !== "전체" && filtered.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setCity("전체")}
          className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
            city === "전체"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
          }`}
        >
          전체
          <span className={`ml-1 tabular-nums ${city === "전체" ? "text-white/70" : "text-gray-400"}`}>
            {rows.length}
          </span>
        </button>
        {REGION_DIVISIONS.map((region) => {
          const active = city === region.id;
          const count = countsByRegion.get(region.id) ?? 0;
          const ready = count > 0;
          return (
            <button
              key={region.id}
              type="button"
              title={region.officialName}
              onClick={() => setCity(region.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                active
                  ? "bg-gray-900 text-white"
                  : ready
                    ? "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                    : "bg-gray-50 text-gray-400 ring-1 ring-gray-100 hover:bg-gray-100"
              }`}
            >
              {region.label}
              {ready ? (
                <span className={`ml-1 tabular-nums ${active ? "text-white/70" : "text-gray-400"}`}>
                  {count}
                </span>
              ) : (
                <span className={`ml-1 text-[10px] ${active ? "text-white/60" : "text-gray-300"}`}>
                  준비중
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isComingSoon ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm font-medium text-gray-800">
              {selectedRegion?.officialName ?? city} 기관은 준비 중입니다
            </p>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-gray-400">
              현재 등록된 대학·기관이 없습니다. 해당 광역자치단체 소속 기관이 추가되면
              이 목록에 표시됩니다.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <SortHeader
                  label="기관"
                  column="name"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-gray-400">
                  Slug
                </th>
                <SortHeader
                  label="문서"
                  column="docs"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  align="center"
                  onSort={onSort}
                />
                <SortHeader
                  label="지식"
                  column="knowledge"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  align="center"
                  onSort={onSort}
                />
                <SortHeader
                  label="멤버"
                  column="members"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  align="center"
                  onSort={onSort}
                />
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase text-gray-400" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row) => {
                const region = regionOf(row.city);
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{row.nameKo}</p>
                      <p className="text-[11px] text-gray-400">
                        {region?.officialName ?? row.city} · {row.id}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.slug}</td>
                    <td className="px-4 py-3 text-center text-xs tabular-nums">{row.documentCount}</td>
                    <td className="px-4 py-3 text-center text-xs tabular-nums">{row.knowledgeCount}</td>
                    <td className="px-4 py-3 text-center text-xs tabular-nums">{row.memberCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/console/organizations/${row.id}`}
                        className="text-xs font-medium text-gray-700 hover:text-gray-900"
                      >
                        계정 보기
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!isComingSoon ? (
        <p className="text-[12px] text-gray-400">
          {filtered.length}곳 표시
          {selectedRegion ? ` · ${selectedRegion.officialName}` : ""}
          {" · "}
          {sortKey === "name"
            ? `가나다 ${sortDir === "asc" ? "오름차순" : "내림차순"}`
            : `${sortKey === "docs" ? "문서" : sortKey === "knowledge" ? "지식" : "멤버"} ${
                sortDir === "asc" ? "적은순" : "많은순"
              }`}
        </p>
      ) : null}
    </div>
  );
}
