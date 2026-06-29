"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import PageShell from "@/components/PageShell";
import ResultsScreen from "@/components/ResultsScreen";
import { buildExtractHomeUrl } from "@/lib/shopping/video-link-storage";
import { findSummaryBySource, formatHistoryDate } from "@/lib/history/storage";
import { useHistory } from "@/lib/history/hooks";
import { useLanguage } from "@/lib/i18n";
import type { HistoryLinkListEntry, HistorySummaryEntry } from "@/types/history";

type Filter = "all" | "summary" | "links";

function SummaryCard({
  entry,
  onOpen,
  onRemove,
}: {
  entry: HistorySummaryEntry;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { t } = useLanguage();
  const hasVideo = Boolean(entry.sourceUrl);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left w-full rounded-2xl border border-line-neutral bg-white p-4 shadow-sm hover:border-accent-300 hover:shadow-md transition-all active:scale-[0.99]"
    >
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
        <p className="mt-1 text-[12px] text-text-secondary truncate">
          {entry.videoTitle}
        </p>
      )}
      <p className="mt-2 text-[12px] text-text-tertiary leading-relaxed line-clamp-2">
        📌 {entry.summaryPreview}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-accent-700">{t("history.openSummary")}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-[11px] text-text-disabled hover:text-danger-800"
        >
          {t("history.remove")}
        </button>
      </div>
    </button>
  );
}

function LinkListCard({
  entry,
  onOpenList,
  onOpenSummary,
}: {
  entry: HistoryLinkListEntry;
  onOpenList: () => void;
  onOpenSummary: (summary: HistorySummaryEntry) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border border-line-neutral bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={onOpenList}
        className="w-full text-left hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{entry.topicEmoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-text-primary leading-snug">{entry.topicTitle}</p>
            <p className="text-[12px] text-text-secondary mt-0.5">
              {t("history.linkCount").replace("{n}", String(entry.links.length))}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[12px] text-text-tertiary line-clamp-1">💡 {entry.situation}</p>
      </button>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entry.links.slice(0, 4).map((link, idx) => {
          const saved = findSummaryBySource(link, entry.situation);
          return (
            <button
              key={`${link}-${idx}`}
              type="button"
              onClick={() => {
                if (saved) onOpenSummary(saved);
                else window.location.href = buildExtractHomeUrl(entry.situation, link);
              }}
              className="rounded-xl border border-line-neutral bg-infoBox px-3 py-2.5 text-left hover:border-accent-300 transition-colors"
            >
              <p className="text-[10px] font-semibold text-accent-700">
                {saved ? t("history.hasSummary") : t("history.summarizeLink")}
              </p>
              <p className="mt-1 text-[11px] text-text-secondary truncate">🔗 {link}</p>
            </button>
          );
        })}
      </div>

      <Link
        href={`/guide/video-links?topic=${entry.topicId}&situation=${encodeURIComponent(entry.situation)}`}
        className="mt-3 inline-block text-[11px] font-semibold text-text-secondary hover:text-accent-700"
      >
        {t("history.editLinks")} →
      </Link>
    </div>
  );
}

function HistoryContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { summaries, linkLists, mounted, remove } = useHistory();
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedList, setExpandedList] = useState<HistoryLinkListEntry | null>(null);

  const openId = searchParams.get("id");
  const selectedSummary = useMemo(
    () => (openId ? summaries.find((s) => s.id === openId) : undefined),
    [openId, summaries],
  );

  function openSummary(entry: HistorySummaryEntry) {
    router.push(`/history?id=${encodeURIComponent(entry.id)}`, { scroll: false });
  }

  function closeSummary() {
    router.push("/history", { scroll: false });
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

  const showSummaries = filter === "all" || filter === "summary";
  const showLinks = filter === "all" || filter === "links";

  return (
    <PageShell topNav="history" bottomNav="history" className="px-4 md:px-6 pt-5">
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold text-text-primary">{t("history.title")}</h1>
        <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">{t("history.desc")}</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(["all", "summary", "links"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold border transition-colors ${
              filter === key
                ? "bg-accent-700 text-white border-accent-700"
                : "bg-white text-text-secondary border-line-neutral hover:border-accent-300"
            }`}
          >
            {t(`history.filter.${key}`)}
          </button>
        ))}
      </div>

      {!mounted ? (
        <div className="rounded-2xl border border-line-neutral bg-infoBox p-8 text-center text-[13px] text-text-tertiary animate-pulse">
          {t("history.loading")}
        </div>
      ) : (
        <>
          {showSummaries && (
            <section className="mb-8">
              <h2 className="text-[15px] font-bold text-text-primary mb-3">
                {t("history.section.summaries")} ({summaries.length})
              </h2>
              {summaries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line-neutral bg-infoBox p-6 text-center">
                  <p className="text-3xl mb-2">📝</p>
                  <p className="text-[13px] text-text-secondary">{t("history.empty.summaries")}</p>
                  <Link href="/" className="mt-3 inline-block text-[12px] font-semibold text-accent-700">
                    {t("history.startSearch")} →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {summaries.map((entry) => (
                    <SummaryCard
                      key={entry.id}
                      entry={entry}
                      onOpen={() => openSummary(entry)}
                      onRemove={() => remove(entry.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {showLinks && (
            <section>
              <h2 className="text-[15px] font-bold text-text-primary mb-3">
                {t("history.section.linkLists")} ({linkLists.length})
              </h2>
              {linkLists.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line-neutral bg-infoBox p-6 text-center">
                  <p className="text-3xl mb-2">🎬</p>
                  <p className="text-[13px] text-text-secondary">{t("history.empty.links")}</p>
                  <Link
                    href="/guide/video-links"
                    className="mt-3 inline-block text-[12px] font-semibold text-accent-700"
                  >
                    {t("history.createLinks")} →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {linkLists.map((entry) => (
                    <LinkListCard
                      key={entry.id}
                      entry={entry}
                      onOpenList={() => setExpandedList(entry)}
                      onOpenSummary={openSummary}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {expandedList && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-background border border-line-neutral shadow-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-2xl">{expandedList.topicEmoji}</p>
                <h3 className="text-[17px] font-bold text-text-primary mt-1">{expandedList.topicTitle}</h3>
                <p className="text-[12px] text-text-secondary mt-1">{expandedList.situation}</p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedList(null)}
                className="text-[13px] text-text-tertiary hover:text-text-primary"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {expandedList.links.map((link, idx) => {
                const saved = findSummaryBySource(link, expandedList.situation);
                return (
                  <button
                    key={`${link}-${idx}`}
                    type="button"
                    onClick={() => {
                      if (saved) {
                        setExpandedList(null);
                        openSummary(saved);
                      } else {
                        router.push(buildExtractHomeUrl(expandedList.situation, link));
                      }
                    }}
                    className="rounded-xl border border-line-neutral bg-white px-4 py-3 text-left hover:border-accent-300 transition-colors"
                  >
                    <p className="text-[11px] font-semibold text-accent-700">
                      {saved ? t("history.openSummary") : t("history.summarizeLink")}
                    </p>
                    <p className="mt-1 text-[12px] text-text-primary truncate">{link}</p>
                    {saved && (
                      <p className="mt-1 text-[11px] text-text-tertiary line-clamp-2">{saved.summaryPreview}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HistoryContent />
    </Suspense>
  );
}
