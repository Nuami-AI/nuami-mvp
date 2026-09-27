"use client";

import { useState, useEffect, useCallback } from "react";
import { HeaderIconButton } from "@/components/ui/header-icon";
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
import { isPhysicalPlaceName } from "@/lib/geo/region";
import GuideFeedbackModal, {
  markGuideFeedbackOffered,
  shouldOfferGuideFeedback,
} from "@/components/guide/GuideFeedback";

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

export default function ResultsScreen({ data, onBack, situation, sourceUrl }: Props) {
  const { t } = useLanguage();
  const { save: persistSave } = useSaves();
  const [guideSaved, setGuideSaved] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

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
    whereTo: sc.whereTo.filter((place) => isPhysicalPlaceName(place)),
  });
  const mapQuery = mapSearch.primary || situationLabel;

  const requestLeave = useCallback(() => {
    if (feedbackOpen) {
      onBack();
      return;
    }
    if (shouldOfferGuideFeedback(situationLabel)) {
      markGuideFeedbackOffered(situationLabel);
      setFeedbackOpen(true);
      return;
    }
    onBack();
  }, [feedbackOpen, onBack, situationLabel]);

  const finishFeedbackAndLeave = useCallback(() => {
    setFeedbackOpen(false);
    onBack();
  }, [onBack]);

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

      <div className="sticky top-0 md:top-14 z-20 h-16 bg-white">
        <div className="mx-auto flex h-full w-full max-w-[1024px] items-center justify-between px-2">
          <HeaderIconButton name="back" label={t("common.back")} onClick={requestLeave} />
          <div className="flex items-center">
            <HeaderIconButton
              name="bookmark"
              label={t("results.bookmark")}
              tintClassName={guideSaved ? "bg-accent-700" : undefined}
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
            />
            <HeaderIconButton name="share" label={t("results.share")} onClick={handleShare} />
          </div>
        </div>
      </div>

      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-text-primary text-white text-[13px] px-4 py-2 rounded-full shadow-lg">
          {t("results.shareCopied")}
        </div>
      )}

      <div className="w-full max-w-[1200px] mx-auto pb-24 md:pb-16">
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
          onBack={requestLeave}
          t={t}
        />
      </div>

      <BottomNav active="guide" />

      <GuideFeedbackModal
        open={feedbackOpen}
        situation={situationLabel}
        scenarioId={data.pipeline?.search.scenarioId}
        t={t}
        onFinished={finishFeedbackAndLeave}
      />
    </div>
  );
}
