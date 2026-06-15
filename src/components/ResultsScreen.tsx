"use client";

import { useState, useEffect, useCallback } from "react";

import type { CulturalEvent } from "@/lib/culture/types";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import type { ActionStep, ContextCard, ExtractionResult, Place, Tip } from "@/types/extraction";

import TopNav from "./TopNav";
import BottomNav from "./BottomNav";

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

function CheckCircle({ done, active }: { done: boolean; active: boolean }) {
  if (done) {
    return (
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-700 flex items-center justify-center">
        <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  return (
    <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${active ? "border-accent-700 bg-accent-50" : "border-line-normal bg-white"}`}>
      {active && <span className="w-2 h-2 rounded-full bg-accent-700" />}
    </span>
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

function interpolate(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

function tipEmoji(cat: Tip["cat"]) {
  const map: Record<Tip["cat"], string> = {
    Time: "⏰", Price: "💰", Etiquette: "🙏", Transport: "🚇", Other: "💡",
  };
  return map[cat] ?? "💡";
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

function MapPlaceholder({ query }: { query: string }) {
  const mapUrl = `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block relative w-full h-44 rounded-xl overflow-hidden bg-gradient-to-br from-[#E8F4FD] to-[#D4E9F7] border border-line-neutral"
    >
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, #94A3B8 0px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #94A3B8 0px, transparent 1px, transparent 20px)" }}
      />
      {[
        { top: "30%", left: "25%" },
        { top: "45%", left: "55%" },
        { top: "60%", left: "35%" },
        { top: "35%", left: "70%" },
      ].map((pos, i) => (
        <span
          key={i}
          className="absolute w-7 h-7 -translate-x-1/2 -translate-y-full"
          style={{ top: pos.top, left: pos.left }}
        >
          <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
            <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="#8651F2" />
            <circle cx="14" cy="14" r="5" fill="white" />
          </svg>
        </span>
      ))}
      <div className="absolute bottom-2 right-2 bg-white/90 rounded-lg px-2 py-1 text-[10px] font-semibold text-accent-700 shadow">
        Kakao Map →
      </div>
    </a>
  );
}

function PlaceRow({ place, t }: { place: Place; t: (k: TranslationKey) => string }) {
  const isOpen = place.status !== "closed";
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-line-neutral last:border-0">
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-[14px] font-semibold text-text-primary leading-snug">{place.name}</p>
        {(place.branchType || place.nameKo) && (
          <p className="text-[12px] text-text-disabled mt-0.5">
            {place.branchType ?? place.nameKo}
          </p>
        )}
      </div>
      {place.status && (
        <span className={`flex-shrink-0 text-[11px] font-semibold rounded-full px-2.5 py-1 ${isOpen ? "bg-accent-50 text-accent-700" : "bg-muted text-text-disabled"}`}>
          {isOpen ? t("results.places.open") : t("results.places.closed")}
        </span>
      )}
    </div>
  );
}

function ActionStepper({ actions, t }: { actions: ActionStep[]; t: (k: TranslationKey) => string }) {
  const [completed, setCompleted] = useState<Set<number>>(() => new Set());
  const [activeIdx, setActiveIdx] = useState(0);

  const toggleStep = (idx: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
    setActiveIdx(idx);
  };

  const doneCount = completed.size;
  const progressLabel = interpolate(t("results.actions.progress"), {
    current: String(Math.max(1, doneCount || (activeIdx + 1))),
    total: String(actions.length),
  });

  return (
    <section className="mt-8 px-4 lg:px-0">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-[16px] font-bold text-text-primary leading-snug flex-1 pr-4">
          {t("results.actions.title")}
        </h2>
        <span className="text-[13px] font-semibold text-accent-700 flex-shrink-0">{progressLabel}</span>
      </div>
      <p className="text-[12px] text-text-disabled mb-4">{t("results.actions.hint")}</p>
      <div className="space-y-2">
        {actions.map((item, idx) => {
          const done = completed.has(idx);
          const active = idx === activeIdx && !done;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggleStep(idx)}
              className={`w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-colors ${
                active
                  ? "border-accent-700 bg-accent-50 shadow-sm"
                  : done
                    ? "border-line-neutral bg-white opacity-60"
                    : "border-line-neutral bg-white"
              }`}
            >
              <CheckCircle done={done} active={active} />
              <div className="flex-1 min-w-0">
                <p className={`text-[14px] leading-snug ${done ? "text-text-disabled line-through" : "text-text-primary font-medium"}`}>
                  {item.action}
                </p>
                {item.detail && !done && (
                  <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">{item.detail}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TipsCarousel({ tips, t, bookmarks }: {
  tips: Tip[];
  t: (k: TranslationKey) => string;
  bookmarks: ReturnType<typeof useBookmarkSet>;
}) {
  return (
    <section className="mt-8">
      <div className="px-4 lg:px-0">
        <SectionHeader icon={<LightbulbIcon />} title={t("results.tips.title")} />
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 lg:px-0 pb-1 snap-x snap-mandatory scrollbar-hide">
        {tips.map((tip, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-[260px] snap-start bg-white rounded-2xl border border-line-neutral shadow-sm overflow-hidden"
          >
            <div className="h-28 bg-gradient-to-br from-accent-100 to-accent-50 flex items-center justify-center text-4xl">
              {tipEmoji(tip.cat)}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-[14px] font-bold text-text-primary leading-snug flex-1">{tip.title}</p>
                <BookmarkBtn filled={bookmarks.has(idx)} onToggle={() => bookmarks.toggle(idx)} size={16} />
              </div>
              <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-3">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContextCallout({ ctx, t }: { ctx: ContextCard; t: (k: TranslationKey) => string }) {
  return (
    <div className="bg-infoBox rounded-2xl p-4 border border-line-neutral">
      <p className="text-[13px] font-bold text-text-primary mb-2">
        {ctx.theme || t("results.contexts.system")}
      </p>
      <p className="text-[13px] text-text-secondary leading-relaxed">{ctx.explanation}</p>
      {ctx.example && (
        <p className="mt-2 text-[12px] text-text-tertiary leading-relaxed border-t border-line-neutral pt-2">
          {ctx.example}
        </p>
      )}
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

export default function ResultsScreen({ data, onBack, situation }: Props) {
  const { t } = useLanguage();
  const phraseBookmarks = useBookmarkSet();
  const pageBookmarked = useBookmarkSet();
  const tipBookmarks = useBookmarkSet();

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
            <BookmarkBtn filled={pageBookmarked.has(0)} onToggle={() => pageBookmarked.toggle(0)} />
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
            {t("results.hero.subtitle")}
          </p>
          <DocumentChips documents={sc.documents} />

          {sc.estimatedMinutes !== undefined && (
            <p className="mt-3 text-[12px] text-text-disabled">
              {t("results.situation.estimatedTime")}:{" "}
              <span className="font-semibold text-accent-700">
                {t("results.situation.minutes").replace("{n}", String(sc.estimatedMinutes))}
              </span>
            </p>
          )}
        </section>

        {/* ── Map & nearby places ── */}
        {(hasPlaces || sc.whereTo.length > 0) && (
          <section className="mt-8 px-4 lg:px-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PinIcon />
                <h2 className="text-[16px] font-bold text-text-primary">{t("results.places.title")}</h2>
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

        {/* ── Pre-visit checklist ── */}
        {sc.checklist.length > 0 && (
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

        {/* ── Action stepper ── */}
        {data.actions && data.actions.length > 0 && (
          <ActionStepper actions={data.actions} t={t} />
        )}

        {/* ── Tips carousel ── */}
        {data.tips.length > 0 ? (
          <TipsCarousel tips={data.tips} t={t} bookmarks={tipBookmarks} />
        ) : (
          <section className="mt-8 px-4 lg:px-0">
            <SectionHeader icon={<LightbulbIcon />} title={t("results.tips.title")} />
            <div className="bg-infoBox rounded-2xl p-4 text-[13px] text-text-tertiary text-center">
              {t("results.tips.empty")}
            </div>
          </section>
        )}

        {/* ── System context callout ── */}
        {systemContext && (
          <section className="mt-8 px-4 lg:px-0">
            <ContextCallout ctx={systemContext} t={t} />
          </section>
        )}

        {/* ── Useful phrases ── */}
        {data.phrases.length > 0 ? (
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
        )}

        {/* ── Insider tips ── */}
        <InsiderTips items={insiderContexts} />

      </div>

      <BottomNav active="home" />
    </div>
  );
}
