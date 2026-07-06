"use client";

import { useState } from "react";
import type { TranslationKey } from "@/lib/i18n";
import type { ActionStep, ContextCard, Place, Tip } from "@/types/extraction";

export function interpolate(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function useBookmarkSet() {
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

function tipEmoji(cat: Tip["cat"]) {
  const map: Record<Tip["cat"], string> = {
    Time: "⏰", Price: "💰", Etiquette: "🙏", Transport: "🚇", Other: "💡",
  };
  return map[cat] ?? "💡";
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

export function ActionStepper({
  actions,
  title,
  t,
}: {
  actions: ActionStep[];
  title: string;
  t: (k: TranslationKey) => string;
}) {
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
    current: String(Math.max(1, doneCount || activeIdx + 1)),
    total: String(actions.length),
  });

  return (
    <section className="rounded-2xl border-2 border-line-neutral overflow-hidden shadow-sm">
      <div className="border-l-4 border-l-accent-700 bg-white px-4 py-3 flex items-start justify-between">
        <h2 className="text-[15px] font-bold text-text-primary leading-snug flex-1 pr-4">👣 {title}</h2>
        <span className="text-[12px] font-bold text-accent-700 flex-shrink-0">{progressLabel}</span>
      </div>
      <div className="border-t-2 border-line-neutral p-3 space-y-2">
        {actions.map((item, idx) => {
          const done = completed.has(idx);
          const active = idx === activeIdx && !done;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggleStep(idx)}
              className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl border-2 transition-colors ${
                active ? "border-accent-700 bg-accent-50 shadow-md" : done ? "border-line-neutral bg-white opacity-60" : "border-line-neutral bg-white"
              }`}
            >
              <CheckCircle done={done} active={active} />
              <div className="flex-1 min-w-0">
                <p className={`text-[14px] leading-snug ${done ? "text-text-disabled line-through" : "text-text-primary font-medium"}`}>
                  {item.action}
                </p>
                {item.detail && !done && (
                  <p className="text-[12px] text-text-secondary mt-1 leading-relaxed line-clamp-2">{item.detail}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LightbulbIcon() {
  return (
    <svg width="16" height="16" fill="#8651F2" viewBox="0 0 24 24">
      <path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V17H9v-2.8A6 6 0 0 1 6 9a6 6 0 0 1 6-6z" />
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

export function TipsCarousel({ tips, t, bookmarks }: {
  tips: Tip[];
  t: (k: TranslationKey) => string;
  bookmarks: ReturnType<typeof useBookmarkSet>;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <LightbulbIcon />
        <h2 className="text-[16px] font-bold text-text-primary">{t("results.tips.title")}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide">
        {tips.map((tip, idx) => (
          <div key={idx} className="flex-shrink-0 w-[280px] snap-start bg-white rounded-2xl border border-line-neutral shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-accent-100 to-accent-50 flex items-center justify-center text-4xl">
              {tipEmoji(tip.cat)}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-[14px] font-bold text-text-primary leading-snug flex-1">{tip.title}</p>
                <BookmarkBtn filled={bookmarks.has(idx)} onToggle={() => bookmarks.toggle(idx)} size={16} />
              </div>
              <p className="text-[12px] text-text-secondary leading-relaxed">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MapPlaceholder({ query, className = "" }: { query: string; className?: string }) {
  const mapUrl = `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`block relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-[#E8F4FD] to-[#D4E9F7] border border-line-neutral ${className}`}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, #94A3B8 0px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #94A3B8 0px, transparent 1px, transparent 20px)" }}
      />
      {[
        { top: "30%", left: "25%" },
        { top: "45%", left: "55%" },
        { top: "60%", left: "35%" },
      ].map((pos, i) => (
        <span key={i} className="absolute w-7 h-7 -translate-x-1/2 -translate-y-full" style={{ top: pos.top, left: pos.left }}>
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

export function PlaceRow({ place, t }: { place: Place; t: (k: TranslationKey) => string }) {
  const isOpen = place.status !== "closed";
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-line-neutral last:border-0">
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-[14px] font-semibold text-text-primary leading-snug">{place.name}</p>
        {(place.branchType || place.nameKo) && (
          <p className="text-[12px] text-text-disabled mt-0.5">{place.branchType ?? place.nameKo}</p>
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

export function ContextCallout({ ctx, systemLabel }: { ctx: ContextCard; systemLabel: string }) {
  return (
    <div className="bg-infoBox rounded-2xl p-4 border border-line-neutral">
      <p className="text-[13px] font-bold text-text-primary mb-2">{ctx.theme || systemLabel}</p>
      <p className="text-[13px] text-text-secondary leading-relaxed">{ctx.explanation}</p>
      {ctx.example && (
        <p className="mt-2 text-[12px] text-text-tertiary leading-relaxed border-t border-line-neutral pt-2">{ctx.example}</p>
      )}
    </div>
  );
}
