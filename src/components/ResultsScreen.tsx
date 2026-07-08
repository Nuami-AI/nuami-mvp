"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import type { ExtractionResult } from "@/types/extraction";
import ResultsTabLayout from "@/components/ResultsTabLayout";
import { interpolate } from "@/components/results-shared";
import { useSaves } from "@/lib/saves/hooks";
import TopNav from "./TopNav";
import BottomNav from "./BottomNav";
import { detectResultVenue, type ResultVenue } from "@/lib/results/venue-context";
import { summarizeSituationQuery } from "@/lib/results/encouragement";
import { resolveMapSearchQuery } from "@/lib/kakao/query-builder";

interface Props {
  data: ExtractionResult;
  onBack: () => void;
  situation?: string;
  sourceUrl?: string;
}

function venueKey(venue: ResultVenue, base: string): TranslationKey {
  if (venue === "default") return base as TranslationKey;
  return `${base}.${venue}` as TranslationKey;
}

// ── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeft() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

export default function ResultsScreen({ data, onBack, situation, sourceUrl }: Props) {
  const { t } = useLanguage();
  const { save: persistSave } = useSaves();
  const [guideSaved, setGuideSaved] = useState(false);

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { displayName?: string } | null) => {
        if (d?.displayName) setDisplayName(d.displayName);
      })
      .catch(() => {});
  }, []);

  const sc = data.situation;
  const situationLabel = situation?.trim() || sc.summary;
  const topicShort = summarizeSituationQuery(situationLabel);
  const venue = detectResultVenue(situationLabel);
  const actionsTitle = t(venueKey(venue, "results.actions.title"));
  const placesTitle = t(venueKey(venue, "results.places.title"));
  const systemContextLabel = t(venueKey(venue, "results.contexts.system"));
  const heroTitle = displayName
    ? interpolate(t("results.hero.title"), { name: displayName, topic: topicShort })
    : topicShort;

  const mapSearch = resolveMapSearchQuery({
    situation: situationLabel,
    venue,
    places: data.places,
    whereTo: sc.whereTo,
  });
  const mapQuery = mapSearch.primary || situationLabel;

  const handleShare = useCallback(async () => {
    const text = `${heroTitle}\n${sc.summary}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "NUAMI Guide", text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  }, [heroTitle, sc.summary]);

  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      <TopNav active="guide" />

      {/* Sticky header */}
      <div className="sticky top-0 md:top-14 z-20 bg-background/95 backdrop-blur-sm border-b border-line-neutral">
        <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="text-text-secondary p-1 -ml-1" aria-label="Back">
            <ArrowLeft />
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (!guideSaved) {
                  persistSave({
                    type: "guide",
                    title: situationLabel,
                    body: sc.summary,
                    memo: "",
                    checked: false,
                    situation: situationLabel,
                    sourceUrl,
                    videoTitle: data.video.title,
                    payload: data,
                  });
                  setGuideSaved(true);
                }
              }}
              className="p-0.5"
              aria-label={t("results.bookmark")}
            >
              <svg width={20} height={20} fill={guideSaved ? "#8651F2" : "none"} stroke={guideSaved ? "#8651F2" : "currentColor"} strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button onClick={handleShare} className="text-text-secondary p-0.5" aria-label={t("results.share")}>
              <ShareIcon />
            </button>
          </div>
        </div>
      </div>

      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-text-primary text-white text-[13px] px-4 py-2 rounded-full shadow-lg">
          {t("results.shareCopied")}
        </div>
      )}

      <div className="w-full max-w-[1200px] mx-auto pb-24 md:pb-16">

        {/* ── Hero ── */}
        <section className="px-4 lg:px-0 mt-5">
          <h1 className="text-[20px] font-bold text-text-primary leading-snug">
            {heroTitle}
          </h1>
        </section>

        <ResultsTabLayout
          data={data}
          situationLabel={situationLabel}
          venue={venue}
          placesTitle={placesTitle}
          actionsTitle={actionsTitle}
          systemContextLabel={systemContextLabel}
          mapQuery={mapQuery}
          destinationCountry={data.video.destinationCountry}
          sourceUrl={sourceUrl}
          onBack={onBack}
          t={t}
        />

      </div>

      <BottomNav active="guide" />
    </div>
  );
}
