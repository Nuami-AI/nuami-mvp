"use client";

import { useState, useEffect, useCallback } from "react";

import type { CulturalEvent } from "@/lib/culture/types";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import type { ContextCard, ExtractionResult } from "@/types/extraction";

import StoreResultsLayout from "@/components/StoreResultsLayout";
import {
  ActionStepper,
  ContextCallout,
  interpolate,
  MapPlaceholder,
  PlaceRow,
  TipsCarousel,
  useBookmarkSet,
} from "@/components/results-shared";
import { useSaves } from "@/lib/saves/hooks";

import TopNav from "./TopNav";
import BottomNav from "./BottomNav";

interface Props {
  data: ExtractionResult;
  onBack: () => void;
  situation?: string;
  sourceUrl?: string;
}

type ResultVenue = "store" | "bank" | "hospital" | "default";

function detectResultVenue(situation: string): ResultVenue {
  const s = situation.toLowerCase();
  if (/쇼핑|올리브영|올영|매장|드럭스토어|화장품|뷰티|k-?beauty|olive|shopping|cosmetic|ショッピング|オリーブ|오프라인|준비사항|제품/.test(s)) {
    return "store";
  }
  if (/은행|계좌|bank|account|銀行|口座/.test(s)) return "bank";
  if (/병원|약국|hospital|clinic|pharmacy|病院|薬局/.test(s)) return "hospital";
  return "default";
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

function BookmarkBtn({ filled, onToggle, size = 20 }: { filled: boolean; onToggle: () => void; size?: number }) {
  return (
    <button onClick={onToggle} className="flex-shrink-0 p-0.5" aria-label={filled ? "Remove bookmark" : "Add bookmark"}>
      <svg width={size} height={size} fill={filled ? "#8651F2" : "none"} stroke={filled ? "#8651F2" : "currentColor"} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" fill="#8651F2" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg width="16" height="16" fill="#8651F2" viewBox="0 0 24 24">
      <path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V17H9v-2.8A6 6 0 0 1 6 9a6 6 0 0 1 6-6z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" fill="#8651F2" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" fill="white" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

const CULTURE_ENABLED = process.env.NEXT_PUBLIC_CULTURE_ENABLED === "true";

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count, trailing }: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-[16px] font-bold text-text-primary">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="text-[13px] text-text-disabled">({count})</span>
        )}
      </div>
      {trailing}
    </div>
  );
}

function DocumentChips({ documents }: { documents: string[] }) {
  if (documents.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {documents.map((doc, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-primary bg-white border border-line-neutral rounded-full px-3.5 py-2 shadow-sm"
        >
          {doc}
          <span className="text-text-disabled"><InfoIcon /></span>
        </span>
      ))}
    </div>
  );
}

function InsiderTips({ items }: { items: ContextCard[] }) {
  const { t } = useLanguage();
  if (items.length === 0) return null;
  return (
    <section className="mt-8 px-4 lg:px-0 mb-8">
      <SectionHeader icon={<ChatIcon />} title={t("results.insider.title")} count={items.length} />
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-3 bg-white rounded-2xl border border-line-neutral p-3 shadow-sm">
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-accent-100 to-accent-50 flex items-center justify-center text-2xl">
              📖
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-text-primary leading-snug">{item.theme}</p>
              <p className="text-[12px] text-text-secondary mt-1 leading-relaxed line-clamp-2">{item.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CultureEvents({ placeName }: { placeName: string }) {
  const { t } = useLanguage();
  const [events, setEvents] = useState<CulturalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/culture/nearby?place=${encodeURIComponent(placeName)}`)
      .then((r) => r.json())
      .then((data: { events: CulturalEvent[] }) => setEvents(data.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [placeName]);

  if (loading || events.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-line-neutral">
      <p className="text-[11px] font-semibold text-text-disabled mb-1">{t("results.culture")}</p>
      <ul className="space-y-1">
        {events.slice(0, 2).map((ev, i) => (
          <li key={i} className="text-[11px] text-text-secondary">
            {ev.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ResultsScreen({ data, onBack, situation, sourceUrl }: Props) {
  const { t } = useLanguage();
  const phraseBookmarks = useBookmarkSet();
  const tipBookmarks = useBookmarkSet();
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
  const venue = detectResultVenue(situationLabel);
  const actionsTitle = t(venueKey(venue, "results.actions.title"));
  const placesTitle = t(venueKey(venue, "results.places.title"));
  const systemContextLabel = t(venueKey(venue, "results.contexts.system"));
  const heroSubtitle =
    venue === "store"
      ? t("results.hero.subtitle.store" as TranslationKey)
      : t("results.hero.subtitle");
  const heroTitle = displayName
    ? interpolate(t("results.hero.title"), { name: displayName, situation: situationLabel })
    : interpolate(t("results.hero.titleNoName"), { situation: situationLabel });

  const systemContext = data.contexts?.[0];
  const insiderContexts = data.contexts?.slice(1) ?? [];

  const mapQuery = data.places[0]?.name ?? sc.whereTo[0] ?? situationLabel;
  const hasPlaces = data.places.length > 0;

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
          <p className="text-[13px] text-text-secondary mt-2 leading-relaxed">
            {heroSubtitle}
          </p>
          {venue !== "store" && <DocumentChips documents={sc.documents} />}

          {venue !== "store" && sc.estimatedMinutes !== undefined && (
            <p className="mt-3 text-[12px] text-text-disabled">
              {t("results.situation.estimatedTime")}:{" "}
              <span className="font-semibold text-accent-700">
                {t("results.situation.minutes").replace("{n}", String(sc.estimatedMinutes))}
              </span>
            </p>
          )}
        </section>

        {venue === "store" && (
          <StoreResultsLayout
            data={data}
            situationLabel={situationLabel}
            placesTitle={placesTitle}
            actionsTitle={actionsTitle}
            systemContextLabel={systemContextLabel}
            mapQuery={mapQuery}
            hasPlaces={hasPlaces}
            sourceUrl={sourceUrl}
            onBack={onBack}
            t={t}
          />
        )}

        {/* ── Map & nearby places (non-store) ── */}
        {venue !== "store" && (hasPlaces || sc.whereTo.length > 0) && (
          <section className="mt-8 px-4 lg:px-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PinIcon />
                <h2 className="text-[16px] font-bold text-text-primary">{placesTitle}</h2>
              </div>
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-[12px] font-medium text-text-secondary"
              >
                <RefreshIcon />
                {t("results.places.changeLocation")}
              </button>
            </div>

            <MapPlaceholder query={mapQuery} />

            <div className="mt-3 bg-white rounded-2xl border border-line-neutral shadow-sm px-4">
              {hasPlaces ? (
                data.places.map((p, idx) => (
                  <div key={idx}>
                    <PlaceRow place={p} t={t} />
                    {CULTURE_ENABLED && idx === 0 && (
                      <div className="pb-3"><CultureEvents placeName={p.name} /></div>
                    )}
                  </div>
                ))
              ) : (
                sc.whereTo.map((place, i) => (
                  <div key={i} className="flex items-center py-3.5 border-b border-line-neutral last:border-0">
                    <p className="text-[14px] font-medium text-text-primary">{place}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ── Pre-visit checklist (non-store) ── */}
        {venue !== "store" && sc.checklist.length > 0 && (
          <section className="mt-6 px-4 lg:px-0">
            <p className="text-[12px] font-semibold text-text-disabled uppercase tracking-wide mb-2">
              {t("results.situation.checklist")}
            </p>
            <div className="bg-white rounded-2xl border border-line-neutral shadow-sm divide-y divide-line-neutral">
              {sc.checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 px-4 py-3 text-[13px] text-text-primary">
                  <span className="mt-0.5 text-accent-700">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Action stepper (non-store) ── */}
        {venue !== "store" && data.actions && data.actions.length > 0 && (
          <section className="mt-8 px-4 lg:px-0">
            <ActionStepper actions={data.actions} title={actionsTitle} t={t} />
          </section>
        )}

        {/* ── Tips carousel (non-store) ── */}
        {venue !== "store" && (data.tips.length > 0 ? (
          <TipsCarousel tips={data.tips} t={t} bookmarks={tipBookmarks} />
        ) : (
          <section className="mt-8 px-4 lg:px-0">
            <SectionHeader icon={<LightbulbIcon />} title={t("results.tips.title")} />
            <div className="bg-infoBox rounded-2xl p-4 text-[13px] text-text-tertiary text-center">
              {t("results.tips.empty")}
            </div>
          </section>
        ))}

        {/* ── System context callout (non-store) ── */}
        {venue !== "store" && systemContext && (
          <section className="mt-8 px-4 lg:px-0">
            <ContextCallout ctx={systemContext} systemLabel={systemContextLabel} />
          </section>
        )}

        {/* ── Useful phrases (non-store) ── */}
        {venue !== "store" && (data.phrases.length > 0 ? (
          <section className="mt-8 px-4 lg:px-0">
            <SectionHeader icon={<ChatIcon />} title={t("results.phrases.title")} count={data.phrases.length} />
            <div className="space-y-3">
              {data.phrases.map((ph, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-line-neutral shadow-sm p-4 relative">
                  <div className="absolute top-3 right-3">
                    <BookmarkBtn filled={phraseBookmarks.has(idx)} onToggle={() => phraseBookmarks.toggle(idx)} size={18} />
                  </div>
                  <p className="text-[15px] font-bold text-text-primary leading-snug pr-8">{ph.pronunciation}</p>
                  <p className="text-[13px] text-text-secondary mt-1">{ph.meaning}</p>
                  {ph.context && (
                    <p className="text-[11px] text-text-disabled mt-1.5 italic">{ph.context}</p>
                  )}
                  <button
                    type="button"
                    disabled
                    className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-text-tertiary border border-line-neutral rounded-full px-3 py-1.5 opacity-60"
                  >
                    <SpeakerIcon />
                    {t("results.phrases.listen")}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-8 px-4 lg:px-0">
            <SectionHeader icon={<ChatIcon />} title={t("results.phrases.title")} />
            <div className="bg-infoBox rounded-2xl p-4 text-[13px] text-text-tertiary text-center">
              {t("results.phrases.empty")}
            </div>
          </section>
        ))}

        {/* ── Insider tips (non-store) ── */}
        {venue !== "store" && <InsiderTips items={insiderContexts} />}

      </div>

      <BottomNav active="home" />
    </div>
  );
}
