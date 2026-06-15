"use client";

// Design Ref: §6.2 platform-pivot — Situation-first card order, VideoEmbed removed.

import { useState, useEffect } from "react";

import type { CulturalEvent } from "@/lib/culture/types";
import { useLanguage } from "@/lib/i18n";
import { getCountryName } from "@/lib/countries";

import TopNav from "./TopNav";
import BottomNav from "./BottomNav";
import type { ExtractionResult } from "@/types/extraction";

interface Props {
  data: ExtractionResult;
  onBack: () => void;
  situation?: string;
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

function CheckIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="#8651F2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" />
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

function ActionIcon() {
  return (
    <svg width="16" height="16" fill="#8651F2" viewBox="0 0 24 24">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function ContextIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="#8651F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function GlanceIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="#8651F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 4v5" />
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

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 className="text-[16px] font-bold text-text-primary">{title}</h2>
      {count !== undefined && count > 0 && (
        <span className="text-[13px] text-text-disabled">({count})</span>
      )}
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

export default function ResultsScreen({ data, onBack, situation }: Props) {
  const { t, lang } = useLanguage();
  const placeBookmarks  = useBookmarkSet();
  const phraseBookmarks = useBookmarkSet();
  const tipBookmarks    = useBookmarkSet();

  const sc = data.situation;
  const heroText = situation?.trim() || sc.summary;

  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      <TopNav active="guide" />

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

        {/* ── Hero banner ── */}
        <div className="mx-4 md:mx-4 lg:mx-0 mt-4 bg-gradient-to-br from-[#6B35D9] to-[#8651F2] rounded-2xl px-5 py-5">
          <p className="text-[12px] font-medium text-purple-200 mb-1.5 tracking-wide">
            {t("results.hero.ready")}
          </p>
          <p className="text-[17px] font-bold text-white leading-snug line-clamp-2">
            {heroText}
          </p>
          <div className="flex items-center gap-3 mt-3">
            {data.places.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[12px] text-purple-200">
                <PinIcon />
                <span className="text-white font-semibold">{data.places.length}</span>
                <span>{t("results.banner.placesFound")}</span>
              </span>
            )}
            {data.video.destinationCountry && (() => {
              const name = getCountryName(data.video.destinationCountry, lang);
              return name ? (
                <span className="text-[12px] text-purple-200">
                  <span className="text-white font-semibold">{name}</span> {t("results.banner.contentAbout")}
                </span>
              ) : null;
            })()}
          </div>
        </div>

        {/* ── Phrases: 이렇게 말해봐요 ── */}
        {data.phrases.length > 0 && (
          <section className="mt-6 px-4 lg:px-0">
            <SectionHeader icon={<ChatIcon />} title={t("results.phrases.title")} />
            <div className="bg-card rounded-2xl border border-line-neutral shadow-sm overflow-hidden">
              {data.phrases.map((ph, idx) => (
                <div key={idx} className={`flex items-start gap-3 px-4 py-3.5 ${idx > 0 ? "border-t border-line-neutral" : ""}`}>
                  <span className="flex-shrink-0 mt-0.5">
                    <CheckIcon />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-text-primary leading-snug">{ph.pronunciation}</p>
                    <p className="text-[13px] text-text-secondary mt-0.5">{ph.meaning}</p>
                    {ph.context && (
                      <p className="text-[11px] text-text-disabled mt-1 italic">{ph.context}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button className="flex items-center gap-1 text-[11px] text-text-tertiary font-medium">
                      <SpeakerIcon />
                    </button>
                    <BookmarkBtn filled={phraseBookmarks.has(idx)} onToggle={() => phraseBookmarks.toggle(idx)} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {data.phrases.length === 0 && (
          <section className="mt-6 px-4 lg:px-0">
            <SectionHeader icon={<ChatIcon />} title={t("results.phrases.title")} />
            <EmptyState message={t("results.phrases.empty")} />
          </section>
        )}

        {/* ── Tips: 이미 알았나요? ── */}
        {data.tips.length > 0 && (
          <section className="mt-6 px-4 lg:px-0">
            <SectionHeader icon={<LightbulbIcon />} title={t("results.tips.title")} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.tips.map((tip, idx) => (
                <div key={idx} className="bg-accent-50 rounded-2xl p-4 border border-accent-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-[14px] font-bold text-accent-900 flex-1 leading-snug">{tip.title}</p>
                    <BookmarkBtn filled={tipBookmarks.has(idx)} onToggle={() => tipBookmarks.toggle(idx)} />
                  </div>
                  <p className="text-[13px] text-accent-800 leading-relaxed">{tip.desc}</p>
                  {tip.source && (
                    <p className="text-[11px] text-accent-600 italic mt-2 leading-relaxed border-l-2 border-accent-200 pl-2">
                      &ldquo;{tip.source}&rdquo;
                    </p>
                  )}
                  <span className="inline-block mt-3 text-[11px] bg-white text-accent-700 border border-accent-200 rounded-full px-2.5 py-1 font-medium">
                    {tip.cat}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
        {data.tips.length === 0 && (
          <section className="mt-6 px-4 lg:px-0">
            <SectionHeader icon={<LightbulbIcon />} title={t("results.tips.title")} />
            <EmptyState message={t("results.tips.empty")} />
          </section>
        )}

        {/* ── Actions: 지금 해야 할 것 ── */}
        {data.actions && data.actions.length > 0 && (
          <section className="mt-6 px-4 lg:px-0">
            <SectionHeader icon={<ActionIcon />} title={t("results.actions.title")} count={data.actions.length} />
            <div className="bg-card rounded-2xl border border-line-neutral shadow-sm divide-y divide-line-neutral overflow-hidden">
              {data.actions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 px-4 py-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-700 text-white text-[12px] font-bold flex items-center justify-center mt-0.5">
                    {item.step}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-text-primary leading-snug">{item.action}</p>
                    {item.detail && (
                      <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">{item.detail}</p>
                    )}
                    {item.source && (
                      <p className="text-[11px] text-text-disabled italic mt-1.5 leading-relaxed border-l-2 border-line-normal pl-2">
                        &ldquo;{item.source}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Situation: 한눈에 보기 ── */}
        <section className="mt-6 px-4 lg:px-0">
          <SectionHeader icon={<GlanceIcon />} title={t("results.situation.title")} />
          <div className="bg-card rounded-2xl border border-line-neutral shadow-sm overflow-hidden">
            <div className="px-4 py-4 border-b border-line-neutral">
              <p className="text-[14px] text-text-primary leading-relaxed">{sc.summary}</p>
            </div>
            <div className="divide-y divide-line-neutral">
              {sc.documents.length > 0 && (
                <div className="px-4 py-3.5">
                  <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-wide mb-2">{t("results.situation.documents")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sc.documents.map((doc, i) => (
                      <span key={i} className="text-[12px] bg-infoBox text-text-secondary rounded-full px-3 py-1">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {sc.whereTo.length > 0 && (
                <div className="px-4 py-3.5">
                  <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-wide mb-2">{t("results.situation.whereTo")}</p>
                  <ul className="space-y-1">
                    {sc.whereTo.map((place, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-text-primary">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-700 shrink-0" />
                        {place}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sc.checklist.length > 0 && (
                <div className="px-4 py-3.5">
                  <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-wide mb-2">{t("results.situation.checklist")}</p>
                  <ul className="space-y-2">
                    {sc.checklist.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-text-primary">
                        <span className="mt-0.5 flex-shrink-0">
                          <CheckIcon />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sc.estimatedMinutes !== undefined && (
                <div className="px-4 py-3">
                  <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-wide mb-1">{t("results.situation.estimatedTime")}</p>
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-700 bg-accent-50 rounded-full px-3 py-1">
                    {t("results.situation.minutes").replace("{n}", String(sc.estimatedMinutes))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Contexts: 알아두면 좋아요 ── */}
        {data.contexts && data.contexts.length > 0 && (
          <section className="mt-6 px-4 lg:px-0">
            <SectionHeader icon={<ContextIcon />} title={t("results.contexts.title")} count={data.contexts.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.contexts.map((ctx, idx) => (
                <div key={idx} className="bg-card rounded-2xl p-4 border border-line-neutral shadow-sm">
                  <p className="text-[13px] font-bold text-text-primary mb-2">{ctx.theme}</p>
                  <p className="text-[13px] text-text-secondary leading-relaxed">{ctx.explanation}</p>
                  {ctx.example && (
                    <p className="mt-2 text-[12px] text-text-tertiary italic leading-relaxed border-t border-line-neutral pt-2">
                      {ctx.example}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Places: 가야 할 곳 ── */}
        {data.places.length > 0 && (
          <section className="mt-6 px-4 lg:px-0 mb-8">
            <SectionHeader icon={<PinIcon />} title={t("results.places.title")} count={data.places.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
        )}

      </div>

      <BottomNav active="home" />
    </div>
  );
}
