"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import PageShell from "@/components/PageShell";
import ResultsScreen from "@/components/ResultsScreen";
import { formatHistoryDate } from "@/lib/history/storage";
import { useHistory } from "@/lib/history/hooks";
import { useLanguage } from "@/lib/i18n";
import type { HistorySummaryEntry } from "@/types/history";

function SummaryCard({
  entry,
  selectMode,
  selected,
  onOpen,
  onToggleSelect,
}: {
  entry: HistorySummaryEntry;
  selectMode: boolean;
  selected: boolean;
  onOpen: () => void;
  onToggleSelect: () => void;
}) {
  const { t } = useLanguage();
  const hasVideo = Boolean(entry.sourceUrl);

  function handleClick() {
    if (selectMode) onToggleSelect();
    else onOpen();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`text-left w-full rounded-2xl border-2 bg-white p-4 shadow-sm transition-all active:scale-[0.99] ${
        selectMode && selected
          ? "border-accent-700 bg-accent-50/40 ring-2 ring-accent-200"
          : "border-line-neutral hover:border-accent-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-3">
        {selectMode && (
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
              selected ? "border-accent-700 bg-accent-700 text-white" : "border-line-normal bg-white"
            }`}
          >
            {selected && (
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent-700">
              {hasVideo ? t("history.badge.video") : t("history.badge.search")}
            </span>
            <span className="text-[10px] text-text-disabled shrink-0">📅 {formatHistoryDate(entry.updatedAt)}</span>
          </div>
          <p className="mt-2 text-[14px] font-bold text-text-primary leading-snug line-clamp-2">
            💬 {entry.situation}
          </p>
          {hasVideo && (
            <p className="mt-1 text-[12px] text-text-secondary truncate">{entry.videoTitle}</p>
          )}
          <p className="mt-2 text-[12px] text-text-tertiary leading-relaxed line-clamp-2">
            📌 {entry.summaryPreview}
          </p>
          {!selectMode && (
            <p className="mt-3 text-[11px] font-semibold text-accent-700">{t("guide.openAction")}</p>
          )}
        </div>
      </div>
    </button>
  );
}

function ActionGuideHubContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { summaries, mounted, removeMany, removeAll } = useHistory();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const openId = searchParams.get("id");
  const selectedSummary = useMemo(
    () => (openId ? summaries.find((s) => s.id === openId) : undefined),
    [openId, summaries],
  );

  function openSummary(entry: HistorySummaryEntry) {
    router.push(`/guide?id=${encodeURIComponent(entry.id)}`, { scroll: false });
  }

  function closeSummary() {
    router.push("/guide", { scroll: false });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    removeMany([...selectedIds]);
    exitSelectMode();
  }

  function handleDeleteAll() {
    if (summaries.length === 0) return;
    if (!window.confirm(t("guide.hub.deleteAllConfirm"))) return;
    removeAll();
    exitSelectMode();
  }

  if (selectedSummary) {
    return (
      <ResultsScreen
        data={selectedSummary.data}
        onBack={closeSummary}
        situation={selectedSummary.situation}
        sourceUrl={selectedSummary.sourceUrl}
      />
    );
  }

  return (
    <PageShell topNav="guide" bottomNav="guide" className="px-4 md:px-6 pt-5">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-extrabold text-text-primary">{t("guide.hub.title")}</h1>
            <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">{t("guide.hub.desc")}</p>
          </div>
          {mounted && summaries.length > 0 && (
            <div className="flex shrink-0 items-center gap-1.5">
              {!selectMode ? (
                <button
                  type="button"
                  onClick={() => setSelectMode(true)}
                  className="rounded-xl border-2 border-line-neutral bg-white px-3 py-2 text-[12px] font-semibold text-text-secondary hover:border-accent-300 hover:text-accent-700 transition-colors"
                >
                  {t("guide.hub.select")}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={exitSelectMode}
                    className="rounded-xl border-2 border-line-neutral bg-white px-3 py-2 text-[12px] font-semibold text-text-secondary hover:bg-muted transition-colors"
                  >
                    {t("guide.hub.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    disabled={selectedIds.size === 0}
                    className="rounded-xl border-2 border-danger-200 bg-danger-50 px-3 py-2 text-[12px] font-semibold text-danger-800 disabled:opacity-40 hover:bg-danger-100 transition-colors"
                  >
                    {t("guide.hub.deleteSelected")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    className="rounded-xl border-2 border-danger-300 bg-white px-3 py-2 text-[12px] font-semibold text-danger-800 hover:bg-danger-50 transition-colors"
                  >
                    {t("guide.hub.deleteAll")}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {!mounted ? (
        <div className="rounded-2xl border-2 border-line-neutral bg-infoBox p-8 text-center text-[13px] text-text-tertiary animate-pulse">
          {t("history.loading")}
        </div>
      ) : summaries.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line-neutral bg-infoBox p-8 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-[14px] font-semibold text-text-primary">{t("guide.hub.empty")}</p>
          <p className="text-[12px] text-text-secondary mt-2 leading-relaxed">{t("guide.hub.emptyHint")}</p>
          <Link
            href="/"
            className="inline-block mt-4 rounded-xl bg-accent-700 text-white text-[13px] font-semibold px-5 py-2.5"
          >
            {t("guide.hub.startSearch")} →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-6">
          {summaries.map((entry) => (
            <SummaryCard
              key={entry.id}
              entry={entry}
              selectMode={selectMode}
              selected={selectedIds.has(entry.id)}
              onOpen={() => openSummary(entry)}
              onToggleSelect={() => toggleSelect(entry.id)}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default function ActionGuideHub() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ActionGuideHubContent />
    </Suspense>
  );
}
