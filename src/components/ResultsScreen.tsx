"use client";

// Design Ref: §5.6 ResultsScreen v2 — NUAMI tokens + responsive card grid.

import { useState, useEffect } from "react";

import type { CulturalEvent } from "@/lib/culture/types";
import { useLanguage } from "@/lib/i18n";

import TopNav from "./TopNav";
import BottomNav from "./BottomNav";
import VideoEmbed from "./VideoEmbed";
import type { ExtractionResult } from "@/types/extraction";

interface Props {
  data: ExtractionResult;
  onBack: () => void;
}

// ── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeft() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M19 12H5M12 5l-7 7 7 7" />
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

function BookmarkBtn({ filled, onToggle }: { filled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex-shrink-0 p-0.5" aria-label={filled ? "Remove bookmark" : "Add bookmark"}>
      <svg width="20" height="20" fill={filled ? "#8651F2" : "none"} stroke={filled ? "#8651F2" : "#E2E2DE"} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}

function SpeakerIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="15" height="15" fill="#8651F2" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function useBookmarkSet() {
  const [set, setSet] = useState<Set<number>>(() => new Set());
  const toggle = (idx: number) =>
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  return { has: (idx: number) => set.has(idx), toggle };
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-infoBox rounded-2xl p-4 text-[13px] text-text-tertiary text-center col-span-full">
      {message}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 className="text-[15px] font-bold text-text-primary">{title}</h2>
      <span className="text-[13px] text-text-disabled">({count})</span>
    </div>
  );
}

// ── Culture Events (FR-07) ─────────────────────────────────────────────────────

const CULTURE_ENABLED = process.env.NEXT_PUBLIC_CULTURE_ENABLED === "true";

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

  if (loading) return null;
  if (events.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-line-neutral">
      <p className="text-[11px] font-semibold text-text-disabled mb-1.5">{t("results.culture")}</p>
      <ul className="space-y-1">
        {events.slice(0, 3).map((ev, i) => (
          <li key={i} className="text-[11px] text-text-secondary leading-snug">
            {ev.url ? (
              <a href={ev.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {ev.title}
              </a>
            ) : (
              <span>{ev.title}</span>
            )}
            {ev.startDate && (
              <span className="text-text-disabled ml-1.5">{ev.startDate}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ResultsScreen({ data, onBack }: Props) {
  const { t } = useLanguage();
  const placeBookmarks  = useBookmarkSet();
  const phraseBookmarks = useBookmarkSet();
  const tipBookmarks    = useBookmarkSet();

  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      <TopNav active="videoai" />

      {/* Sticky sub-header */}
      <div className="sticky top-0 md:top-14 z-10 bg-background border-b border-line-neutral">
        <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="text-text-secondary p-1 -ml-1" aria-label="Back">
            <ArrowLeft />
          </button>
          <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary pr-1">
            <RefreshIcon />
            {t("results.reExtract")}
          </button>
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto pb-24 md:pb-16">

        {/* Video card */}
        <div className="bg-card md:mx-4 lg:mx-0 md:mt-4 md:rounded-2xl md:overflow-hidden md:border md:border-line-neutral">
          {data.video.videoId ? (
            <VideoEmbed videoId={data.video.videoId} title={data.video.title} />
          ) : (
            <div className="w-full aspect-video bg-gray-900 relative flex items-center justify-center">
              <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                <svg width="22" height="22" fill="#8651F2" viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div className="absolute bottom-2 right-3 bg-red-600 rounded px-1.5 py-0.5">
                <span className="text-white text-[10px] font-bold tracking-wide">▶ YouTube</span>
              </div>
            </div>
          )}
          <div className="px-4 py-3">
            <p className="text-[14px] font-semibold text-text-primary leading-snug line-clamp-2">
              {data.video.title}
            </p>
            <p className="text-[12px] text-text-tertiary mt-1.5 flex items-center gap-1.5">
              <span className="w-4 h-4 bg-muted rounded-full inline-flex items-center justify-center text-[8px] text-text-secondary font-semibold">
                {data.video.channel.charAt(0).toUpperCase() || "?"}
              </span>
              {data.video.channel}
            </p>
          </div>
        </div>

        {/* Analysis banner */}
        <div className="mx-4 md:mx-4 lg:mx-0 mt-3 bg-accent-50 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <div className="mt-0.5 flex-shrink-0">
            <StarIcon />
          </div>
          <p className="text-[12px] text-accent-900 leading-relaxed">
            <span className="font-semibold">
              {data.places.length}{t("results.banner.detected")}
              {data.video.destinationCountry ? ` (${data.video.destinationCountry})` : ""}
            </span>
            {data.video.userLanguage && (
              <span className="ml-1 text-accent-700">
                {data.video.userLanguage.toUpperCase()}{t("results.banner.resultsIn")}
              </span>
            )}
          </p>
        </div>

        {/* ── Places ── */}
        <section className="mt-5 px-4 lg:px-0">
          <SectionHeader icon={<PinIcon />} title={t("results.places.title")} count={data.places.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.places.length === 0 && (
              <EmptyState message={t("results.places.empty")} />
            )}
            {data.places.map((p, idx) => (
              <div key={idx} className="bg-card rounded-2xl p-4 border border-line-neutral shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[15px] font-bold text-text-primary">{p.name}</p>
                    {p.nameKo && <p className="text-[12px] text-text-disabled mt-0.5">{p.nameKo}</p>}
                  </div>
                  <BookmarkBtn filled={placeBookmarks.has(idx)} onToggle={() => placeBookmarks.toggle(idx)} />
                </div>
                <p className="text-[13px] text-text-secondary mt-2 leading-relaxed">{p.desc}</p>
                <p className="text-[12px] text-text-disabled italic mt-2 leading-relaxed">
                  &ldquo;{p.quote}&rdquo;
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <a
                    href={`https://map.kakao.com/link/search/${encodeURIComponent(p.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${p.name} 카카오맵`}
                    className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-yellow-700"
                  >
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="#F59E0B">
                      <circle cx="10" cy="10" r="10" fill="#FDE68A" />
                      <text x="5" y="14" fontSize="9" fontWeight="bold" fill="#92400E">k</text>
                    </svg>
                    {t("results.mapKakao")}
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${p.name} 구글맵`}
                    className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-blue-700"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#4285F4">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    {t("results.mapGoogle")}
                  </a>
                </div>
                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.tags.map((tag) => (
                      <span key={tag} className="text-[11px] bg-infoBox text-text-tertiary rounded-full px-2.5 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {CULTURE_ENABLED && <CultureEvents placeName={p.name} />}
              </div>
            ))}
          </div>
        </section>

        {/* ── Local Phrases ── */}
        <section className="mt-5 px-4 lg:px-0">
          <SectionHeader icon={<ChatIcon />} title={t("results.phrases.title")} count={data.phrases.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.phrases.length === 0 && <EmptyState message={t("results.phrases.empty")} />}
            {data.phrases.map((ph, idx) => (
              <div key={idx} className="bg-card rounded-2xl px-4 pt-4 pb-3 border border-line-neutral shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-text-primary leading-snug">{ph.pronunciation}</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">{ph.meaning}</p>
                    {ph.context && (
                      <p className="text-[11px] text-text-disabled mt-1 italic">{ph.context}</p>
                    )}
                  </div>
                  <BookmarkBtn filled={phraseBookmarks.has(idx)} onToggle={() => phraseBookmarks.toggle(idx)} />
                </div>
                <button className="mt-2.5 flex items-center gap-1.5 text-[12px] text-text-tertiary font-medium">
                  <SpeakerIcon />
                  {t("results.phrases.listen")}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Insider Tips ── */}
        <section className="mt-5 px-4 lg:px-0 mb-8">
          <SectionHeader icon={<LightbulbIcon />} title={t("results.tips.title")} count={data.tips.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.tips.length === 0 && <EmptyState message={t("results.tips.empty")} />}
            {data.tips.map((tip, idx) => (
              <div key={idx} className="bg-card rounded-2xl p-4 border border-line-neutral shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-bold text-text-primary flex-1 leading-snug">{tip.title}</p>
                  <BookmarkBtn filled={tipBookmarks.has(idx)} onToggle={() => tipBookmarks.toggle(idx)} />
                </div>
                <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">{tip.desc}</p>
                <span className="inline-block mt-3 text-[11px] bg-infoBox text-text-tertiary rounded-full px-2.5 py-1">
                  {tip.cat}
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>

      <BottomNav active="videoai" />
    </div>
  );
}
