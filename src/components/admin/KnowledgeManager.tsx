"use client";

import { useEffect, useRef, useState } from "react";

import { KNOWLEDGE_CATEGORY_LABEL, type KnowledgeCategory } from "@/lib/institution/catalog";

interface InstitutionRow {
  id: string;
  nameKo: string;
  nameEn: string;
  city: string;
  documentCount: number;
  knowledgeCount: number;
}

interface DocumentRow {
  id: string;
  title: string;
  category: string;
  fileName: string;
  mimeType?: string;
  status: string;
  errorMessage?: string | null;
  uploadedBy?: string;
  createdAt: string;
}

interface SourceRow {
  id: string;
  label: string;
  url: string;
  status: string;
  errorMessage?: string | null;
  pageCount?: number;
}

interface KnowledgeRow {
  id: string;
  title: string;
  category: string;
  summary: string;
  facts: string[];
  documents: string[];
  whereTo: string[];
  keywords: string[];
  source: string;
  verified: boolean;
  publicDataNote?: string | null;
  documentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  origin?: {
    id: string;
    title: string;
    fileName: string;
    mimeType: string;
  } | null;
}

const CATEGORY_OPTIONS: KnowledgeCategory[] = ["orientation", "academic", "living-tips", "admin"];

function sourceBadge(source: string): { label: string; className: string } {
  if (source === "website") {
    return { label: "홈페이지", className: "text-sky-700 bg-sky-50" };
  }
  if (source === "learned") {
    return { label: "학습", className: "text-amber-700 bg-amber-50" };
  }
  return { label: "검증", className: "text-emerald-700 bg-emerald-50" };
}

function statusLabel(status: string): string {
  if (status === "ready") return "학습 완료";
  if (status === "learning") return "학습 중";
  if (status === "failed") return "실패";
  return "대기";
}

function categoryLabel(category: string): string {
  return KNOWLEDGE_CATEGORY_LABEL[category as KnowledgeCategory] ?? category;
}

function formatWhen(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function originLabel(row: KnowledgeRow): string {
  if (row.origin?.fileName) return row.origin.fileName;
  if (row.origin?.title) return row.origin.title;
  if (row.source === "website") return "공식 홈페이지";
  if (row.source === "upload") return "업로드 자료";
  return "출처 없음";
}

export default function KnowledgeManager({
  lockedInstitutionId,
  view = "all",
}: {
  lockedInstitutionId?: string;
  view?: "all" | "content" | "knowledge" | "logs";
}) {
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
  const [institutionId, setInstitutionId] = useState(lockedInstitutionId ?? "korea-university");
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeRow[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<KnowledgeCategory>("orientation");
  const [file, setFile] = useState<File | null>(null);
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [error, setError] = useState("");
  const [openKnowledgeId, setOpenKnowledgeId] = useState<string | null>(null);
  const [sourceExcerpt, setSourceExcerpt] = useState("");
  const [sourceTruncated, setSourceTruncated] = useState(false);
  const [excerptLoading, setExcerptLoading] = useState(false);
  const [knowledgeQuery, setKnowledgeQuery] = useState("");
  const [knowledgeCategory, setKnowledgeCategory] = useState<"all" | KnowledgeCategory>("all");
  const detailInFlight = useRef(false);
  const wasLearning = useRef(false);

  async function loadInstitutions() {
    const res = await fetch("/api/admin/institutions");
    const body = await res.json() as { institutions?: InstitutionRow[] };
    setInstitutions(body.institutions ?? []);
  }

  async function loadDetail(id: string, opts?: { keepOpen?: boolean }) {
    if (detailInFlight.current) return;
    detailInFlight.current = true;
    try {
    const [docsRes, sourcesRes] = await Promise.all([
      fetch(`/api/admin/institutions/${id}/documents`),
      fetch(`/api/admin/institutions/${id}/sources`),
    ]);
    const docsBody = await docsRes.json() as { documents?: DocumentRow[]; knowledge?: KnowledgeRow[] };
    const sourcesBody = await sourcesRes.json() as { sources?: SourceRow[] };
    setDocuments(docsBody.documents ?? []);
    setKnowledge((docsBody.knowledge ?? []).map((row) => ({
      ...row,
      facts: row.facts ?? [],
      documents: row.documents ?? [],
      whereTo: row.whereTo ?? [],
      keywords: row.keywords ?? [],
    })));
    setSources(sourcesBody.sources ?? []);
    if (!opts?.keepOpen) {
      setOpenKnowledgeId(null);
      setSourceExcerpt("");
      setSourceTruncated(false);
    }
    } finally {
      detailInFlight.current = false;
    }
  }

  useEffect(() => {
    if (lockedInstitutionId) setInstitutionId(lockedInstitutionId);
  }, [lockedInstitutionId]);

  useEffect(() => {
    loadInstitutions().catch(() => setError("기관 목록을 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    if (!institutionId) return;
    loadDetail(institutionId).catch(() => setError("자료를 불러오지 못했습니다."));
  }, [institutionId]);

  const isLearning = sources.some((row) => row.status === "learning");
  useEffect(() => {
    if (isLearning) wasLearning.current = true;
    else if (wasLearning.current && institutionId) {
      wasLearning.current = false;
      loadDetail(institutionId, { keepOpen: true }).catch(() => {});
    }
  }, [isLearning, institutionId]);

  useEffect(() => {
    if (!institutionId || !isLearning) return;
    let cancelled = false;
    let inFlight = false;
    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const res = await fetch(`/api/admin/institutions/${institutionId}/sources`);
        const body = (await res.json()) as { sources?: SourceRow[] };
        if (!cancelled) setSources(body.sources ?? []);
      } catch {
        /* keep last snapshot */
      } finally {
        inFlight = false;
      }
    };
    const timer = window.setInterval(() => void tick(), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [institutionId, isLearning]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("파일을 선택하세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("title", title);
      form.set("category", category);
      const res = await fetch(`/api/admin/institutions/${institutionId}/documents`, {
        method: "POST",
        body: form,
      });
      const body = await res.json() as { error?: string; message?: string };
      if (!res.ok) {
        setError(body.message || body.error || "업로드에 실패했습니다.");
        return;
      }
      setTitle("");
      setFile(null);
      await Promise.all([loadInstitutions(), loadDetail(institutionId)]);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSource(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceLabel.trim() || !sourceUrl.trim()) {
      setError("사이트 이름과 주소를 입력하세요.");
      return;
    }
    setSourceLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/institutions/${institutionId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: sourceLabel, url: sourceUrl }),
      });
      const body = await res.json() as { error?: string; message?: string };
      if (!res.ok) {
        setError(body.message || body.error || "사이트를 저장하지 못했습니다.");
        return;
      }
      setSourceLabel("");
      setSourceUrl("");
      await Promise.all([loadInstitutions(), loadDetail(institutionId)]);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSourceLoading(false);
    }
  }

  async function handleRelearn(sourceId: string) {
    setSourceLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/institutions/${institutionId}/sources/${sourceId}`, {
        method: "POST",
      });
      const body = await res.json() as { error?: string; message?: string };
      if (!res.ok) {
        setError(body.message || body.error || "다시 학습하지 못했습니다.");
        return;
      }
      await loadDetail(institutionId);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSourceLoading(false);
    }
  }

  async function handleDeleteKnowledge(knowledgeId: string) {
    if (!window.confirm("이 안내 지식을 삭제할까요? 학생 답변에 더 이상 쓰이지 않습니다.")) {
      return;
    }
    setError("");
    try {
      const res = await fetch(`/api/admin/institutions/${institutionId}/knowledge/${knowledgeId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string; message?: string };
        setError(body.message || body.error || "삭제하지 못했습니다.");
        return;
      }
      if (openKnowledgeId === knowledgeId) {
        setOpenKnowledgeId(null);
        setSourceExcerpt("");
      }
      await Promise.all([loadInstitutions(), loadDetail(institutionId)]);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
  }

  async function toggleKnowledge(row: KnowledgeRow) {
    if (openKnowledgeId === row.id) {
      setOpenKnowledgeId(null);
      setSourceExcerpt("");
      setSourceTruncated(false);
      return;
    }
    setOpenKnowledgeId(row.id);
    setSourceExcerpt("");
    setSourceTruncated(false);
    setExcerptLoading(true);
    try {
      const res = await fetch(`/api/admin/institutions/${institutionId}/knowledge/${row.id}`);
      const body = await res.json() as { knowledge?: { sourceExcerpt?: string; sourceTruncated?: boolean } };
      if (res.ok) {
        setSourceExcerpt(body.knowledge?.sourceExcerpt ?? "");
        setSourceTruncated(Boolean(body.knowledge?.sourceTruncated));
      }
    } catch {
      setSourceExcerpt("");
    } finally {
      setExcerptLoading(false);
    }
  }

  async function handleDeleteSource(sourceId: string) {
    setSourceLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/institutions/${institutionId}/sources/${sourceId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string; message?: string };
        setError(body.message || body.error || "삭제하지 못했습니다.");
        return;
      }
      await Promise.all([loadInstitutions(), loadDetail(institutionId)]);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSourceLoading(false);
    }
  }

  const selected = institutions.find((row) => row.id === institutionId);
  const showPicker = view === "all" || !lockedInstitutionId;
  const showContent = view === "all" || view === "content";
  const showKnowledge = view === "all" || view === "knowledge";
  const showLogs = view === "all" || view === "logs";
  const filteredKnowledge = knowledge.filter((row) => {
    if (knowledgeCategory !== "all" && row.category !== knowledgeCategory) return false;
    const q = knowledgeQuery.trim().toLowerCase();
    if (!q) return true;
    return `${row.title} ${row.summary} ${row.facts.join(" ")} ${row.keywords.join(" ")}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {showPicker ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-900">기관 선택</p>
          <p className="mt-1 text-xs text-gray-400">
            공식 홈페이지를 넣으면 핵심만 학습해 두고, PDF도 함께 올릴 수 있습니다. 학생 질문에는 저장된 검증 사실만 사용합니다.
          </p>
          {lockedInstitutionId ? null : (
            <select
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="mt-3 w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {institutions.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.city} · {row.nameKo} ({row.knowledgeCount}건)
                </option>
              ))}
            </select>
          )}
          {selected && (
            <p className="mt-2 text-xs text-gray-500">
              {selected.nameEn} · 문서 {selected.documentCount} · 검증 지식 {selected.knowledgeCount}
            </p>
          )}
          {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : null}

      {showContent ? (
        <>
          <form onSubmit={handleAddSource} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-900">공식 홈페이지 / 연계 사이트</p>
            <p className="text-xs text-gray-400">
              저장하거나 이어서 학습을 누르면 서버가 백그라운드에서 같은 사이트 하위 페이지를 읽습니다.
              다른 메뉴로 이동해도 학습은 계속됩니다. 이미 읽은 페이지는 건너뜁니다. 외부 사이트는 열지 않습니다.
            </p>
            <input
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
              placeholder="사이트 이름 (예: 고려대 유학생교류처)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://oia.korea.ac.kr"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={sourceLoading}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {sourceLoading ? "등록 중…" : "저장하고 핵심 학습"}
            </button>
            {sources.length > 0 ? (
              <div className="space-y-2 pt-2">
                {sources.map((row) => (
                  <div key={row.id} className="rounded-lg border border-gray-100 px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">{row.label}</p>
                        <p className="truncate text-[11px] text-gray-400">{row.url}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {statusLabel(row.status)}
                          {row.pageCount ? ` · ${row.pageCount}페이지` : ""}
                        </p>
                        {row.errorMessage ? <p className="text-[11px] text-red-500">{row.errorMessage}</p> : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={sourceLoading || row.status === "learning"}
                          onClick={() => handleRelearn(row.id)}
                          className="text-[11px] font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
                        >
                          {row.status === "learning"
                            ? "학습 중"
                            : (row.pageCount ?? 0) > 0
                              ? "이어서 학습"
                              : "다시 학습"}
                        </button>
                        <button
                          type="button"
                          disabled={sourceLoading}
                          onClick={() => handleDeleteSource(row.id)}
                          className="text-[11px] font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">아직 등록한 사이트가 없습니다.</p>
            )}
          </form>

          <form onSubmit={handleUpload} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-900">자료 업로드</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="자료 제목 (예: 2026 외국인 신입생 가이드)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as KnowledgeCategory)}
              className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {CATEGORY_OPTIONS.map((value) => (
                <option key={value} value={value}>{KNOWLEDGE_CATEGORY_LABEL[value]}</option>
              ))}
            </select>
            <input
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "AI 판독·검증 중…" : "업로드하고 검증하기"}
            </button>
          </form>
        </>
      ) : null}

      {showLogs ? (
        <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">수집 이력</p>
            <p className="mt-0.5 text-xs text-gray-400">업로드한 PDF와 홈페이지에서 읽어 온 페이지입니다. {documents.length}건</p>
          </div>
          {documents.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-400">아직 이력이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">시각</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">유형</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">제목</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">출처</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((row) => {
                    const kind = documentKind(row);
                    const href = row.fileName.startsWith("http") ? row.fileName : null;
                    return (
                      <tr key={row.id} className="border-b border-gray-50 align-top">
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-gray-500">{formatWhen(row.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${kind.className}`}>
                            {kind.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{row.title}</p>
                          <p className="text-[11px] text-gray-400">{categoryLabel(row.category)}</p>
                          {row.errorMessage ? <p className="mt-1 text-[11px] text-red-500">{row.errorMessage}</p> : null}
                        </td>
                        <td className="max-w-xs px-4 py-3 text-[12px] text-gray-500">
                          {href ? (
                            <a href={href} target="_blank" rel="noreferrer" className="break-all text-sky-700 hover:underline">
                              {href}
                            </a>
                          ) : (
                            <span className="break-all">{row.fileName}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-gray-600">{row.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {showKnowledge ? (
        <section className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">검증된 안내</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {filteredKnowledge.length}건 / 전체 {knowledge.length}건
                </p>
              </div>
              <input
                value={knowledgeQuery}
                onChange={(e) => setKnowledgeQuery(e.target.value)}
                placeholder="제목, 사실, 키워드 검색"
                className="w-full max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <FilterChip
                label="전체"
                active={knowledgeCategory === "all"}
                onClick={() => setKnowledgeCategory("all")}
              />
              {CATEGORY_OPTIONS.map((value) => (
                <FilterChip
                  key={value}
                  label={KNOWLEDGE_CATEGORY_LABEL[value]}
                  active={knowledgeCategory === value}
                  onClick={() => setKnowledgeCategory(value)}
                />
              ))}
            </div>
          </div>

          {knowledge.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-sm text-gray-400">저장된 지식이 없습니다.</p>
          ) : filteredKnowledge.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-sm text-gray-400">검색 조건에 맞는 항목이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {filteredKnowledge.map((row) => {
                const open = openKnowledgeId === row.id;
                const badge = sourceBadge(row.source);
                const originHref = row.origin?.fileName?.startsWith("http") ? row.origin.fileName : null;
                return (
                  <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" onClick={() => toggleKnowledge(row)} className="min-w-0 flex-1 text-left">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h2 className="text-[15px] font-semibold text-gray-900">{row.title}</h2>
                          <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${badge.className}`}>
                            {badge.label}
                          </span>
                          <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${row.verified ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"}`}>
                            {row.verified ? "검증됨" : "미검증"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-gray-600">{row.summary}</p>
                        <p className="mt-2 text-[11px] text-gray-400">
                          {categoryLabel(row.category)}
                          {row.facts.length ? ` · 사실 ${row.facts.length}개` : ""}
                          {formatWhen(row.updatedAt) ? ` · ${formatWhen(row.updatedAt)}` : ""}
                        </p>
                      </button>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleKnowledge(row)}
                          className="rounded-md border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                        >
                          {open ? "접기" : "자세히"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteKnowledge(row.id)}
                          className="text-[11px] font-medium text-red-500 hover:text-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {open ? (
                      <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
                        <DetailBlock label="출처">
                          <p>{row.origin?.title || originLabel(row)}</p>
                          {originHref ? (
                            <a href={originHref} target="_blank" rel="noreferrer" className="break-all text-sky-700 hover:underline">
                              {originHref}
                            </a>
                          ) : (
                            <p className="break-all text-gray-500">{originLabel(row)}</p>
                          )}
                        </DetailBlock>
                        {row.publicDataNote ? (
                          <DetailBlock label="검증 메모">
                            <p>{row.publicDataNote}</p>
                          </DetailBlock>
                        ) : null}
                        <div className="sm:col-span-2">
                          {row.facts.length > 0 ? (
                            <DetailBlock label="학습된 사실 (학생 답변에 사용)">
                              <ul className="list-disc space-y-1.5 pl-4 leading-6">
                                {row.facts.map((fact) => <li key={fact}>{fact}</li>)}
                              </ul>
                            </DetailBlock>
                          ) : (
                            <p className="text-[12px] text-amber-700">추출된 사실이 없습니다. 삭제 후 다시 학습하는 편이 안전합니다.</p>
                          )}
                        </div>
                        {row.documents.length > 0 ? (
                          <DetailBlock label="필요 서류">
                            <ul className="list-disc space-y-1 pl-4 leading-6">
                              {row.documents.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                          </DetailBlock>
                        ) : null}
                        {row.whereTo.length > 0 ? (
                          <DetailBlock label="방문 장소">
                            <ul className="list-disc space-y-1 pl-4 leading-6">
                              {row.whereTo.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                          </DetailBlock>
                        ) : null}
                        {row.keywords.length > 0 ? (
                          <DetailBlock label="검색 키워드">
                            <p className="leading-6">{row.keywords.join(" · ")}</p>
                          </DetailBlock>
                        ) : null}
                        <div className="sm:col-span-2">
                          <DetailBlock label="학습 원문">
                            {excerptLoading ? (
                              <p className="text-gray-400">원문을 불러오는 중…</p>
                            ) : sourceExcerpt ? (
                              <>
                                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-[12px] leading-6 text-gray-600">
                                  {sourceExcerpt}
                                </pre>
                                {sourceTruncated ? <p className="mt-1 text-[11px] text-gray-400">앞부분만 표시했습니다.</p> : null}
                              </>
                            ) : (
                              <p className="text-gray-400">원문을 찾을 수 없습니다.</p>
                            )}
                          </DetailBlock>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-500">{label}</p>
      <div className="mt-1 text-[13px] text-gray-700">{children}</div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[12px] font-medium ${
        active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

function documentKind(row: DocumentRow): { label: string; className: string } {
  const mime = (row.mimeType ?? "").toLowerCase();
  if (mime.includes("pdf") || row.fileName.toLowerCase().endsWith(".pdf")) {
    return { label: "PDF", className: "text-violet-700 bg-violet-50" };
  }
  if (mime.includes("html") || row.fileName.startsWith("http")) {
    return { label: "웹페이지", className: "text-sky-700 bg-sky-50" };
  }
  return { label: "파일", className: "text-gray-600 bg-gray-100" };
}
