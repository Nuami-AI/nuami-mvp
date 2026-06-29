"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { CulturalEvent } from "@/lib/culture/types";
import type { TranslationKey } from "@/lib/i18n";
import { K_BEAUTY_TRENDS } from "@/lib/shopping/video-research";
import type { ContextCard, ExtractionResult } from "@/types/extraction";
import ShoppingMemoPanel from "@/components/ShoppingMemoPanel";
import OliveYoungProducts from "@/components/OliveYoungProducts";
import VideoResearchPrompts from "@/components/VideoResearchPrompts";
import KakaoMap from "@/components/KakaoMap";
import {
  ActionStepper,
  ContextCallout,
  PlaceRow,
  TipsCarousel,
  useBookmarkSet,
} from "@/components/results-shared";

type ResultsTab = "guide" | "places" | "memo";
type ResultVenue = "store" | "bank" | "hospital" | "default";

const TABS: { id: ResultsTab; labelKey: TranslationKey }[] = [
  { id: "guide", labelKey: "results.tab.guide" },
  { id: "places", labelKey: "results.tab.places" },
  { id: "memo", labelKey: "results.tab.memo" },
];

const CULTURE_ENABLED = process.env.NEXT_PUBLIC_CULTURE_ENABLED === "true";

interface Props {
  data: ExtractionResult;
  situationLabel: string;
  venue: ResultVenue;
  placesTitle: string;
  actionsTitle: string;
  systemContextLabel: string;
  mapQuery: string;
  hasPlaces: boolean;
  sourceUrl?: string;
  onBack: () => void;
  t: (k: TranslationKey) => string;
}

function ChatIcon() {
  return (
    <svg width="16" height="16" fill="#8651F2" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BookmarkBtn({ filled, onToggle }: { filled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex-shrink-0 p-0.5" aria-label="bookmark">
      <svg width={18} height={18} fill={filled ? "#8651F2" : "none"} stroke={filled ? "#8651F2" : "currentColor"} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}

function CultureEvents({ placeName, t }: { placeName: string; t: (k: TranslationKey) => string }) {
  const [events, setEvents] = useState<CulturalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/culture/nearby?place=${encodeURIComponent(placeName)}`)
      .then((r) => r.json())
      .then((d: { events: CulturalEvent[] }) => setEvents(d.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [placeName]);

  if (loading || events.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-line-neutral">
      <p className="text-[11px] font-semibold text-text-disabled mb-1">{t("results.culture")}</p>
      <ul className="space-y-1">
        {events.slice(0, 2).map((ev, i) => (
          <li key={i} className="text-[11px] text-text-secondary">{ev.title}</li>
        ))}
      </ul>
    </div>
  );
}

function TrendsSection({ situationLabel, venue }: { situationLabel: string; venue: ResultVenue }) {
  if (venue !== "store") {
    return (
      <div className="bg-gradient-to-br from-accent-50 to-pink-50 rounded-2xl border border-accent-100 p-4">
        <p className="text-[14px] font-bold text-text-primary mb-1">{K_BEAUTY_TRENDS[0]?.label ?? "한국 생활 트렌드"}</p>
        <p className="text-[12px] text-text-secondary leading-relaxed mb-3">
          영상 URL을 추가하면 요약본과 키워드를 메모에 쌓을 수 있어요.
        </p>
        <Link
          href={`/guide/video-links?topic=trend&situation=${encodeURIComponent(situationLabel)}`}
          className="inline-flex items-center justify-center w-full rounded-xl bg-accent-700 text-white text-[13px] font-semibold py-2.5 hover:bg-accent-800 transition-colors"
        >
          관련 영상 찾기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-[15px] font-bold text-text-primary">지금 한국의 트렌드</h3>
        <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">
          매장 가기 전에 요즘 뜨는 색감·제형을 빠르게 훑어보세요.
        </p>
      </div>
      {K_BEAUTY_TRENDS.slice(0, 2).map((block) => (
        <div key={block.id} className="bg-white rounded-2xl border border-line-neutral shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-accent-50 to-pink-50 px-4 py-2.5 border-b border-line-neutral">
            <p className="text-[13px] font-bold text-text-primary">{block.label}</p>
          </div>
          <ul className="px-4 py-2.5 flex flex-col gap-1.5">
            {block.items.slice(0, 3).map((item) => (
              <li key={item} className="flex items-start gap-2 text-[12px] text-text-secondary">
                <span className="text-accent-600 shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function ResultsTabLayout({
  data,
  situationLabel,
  venue,
  placesTitle,
  actionsTitle,
  systemContextLabel,
  mapQuery,
  hasPlaces,
  sourceUrl,
  onBack,
  t,
}: Props) {
  const [activeTab, setActiveTab] = useState<ResultsTab>("guide");
  const tipBookmarks = useBookmarkSet();
  const phraseBookmarks = useBookmarkSet();
  const sc = data.situation;
  const systemContext = data.contexts?.[0];
  const insiderContexts = data.contexts?.slice(1) ?? [];

  const productQueries = [
    ...(data.products ?? []).map((p) => p.searchQuery ?? p.name),
    ...data.tips.map((tip) => tip.title),
  ];

  return (
    <div className="mt-6">
      <div className="px-4 lg:px-0">
        <div className="flex gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-colors ${
                  isActive ? "bg-accent-700 text-white shadow-sm" : "bg-infoBox text-text-secondary hover:bg-accent-50"
                }`}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 px-4 lg:px-0">
        {/* ── Tab 1: Guide (summary, prep, actions, phrases) ── */}
        {activeTab === "guide" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-line-neutral shadow-sm p-4">
              <p className="text-[12px] font-semibold text-text-disabled uppercase tracking-wide mb-2">
                {t("results.situation.title")}
              </p>
              <p className="text-[14px] text-text-primary leading-relaxed">{sc.summary}</p>
              {sc.estimatedMinutes !== undefined && (
                <p className="mt-3 text-[12px] text-text-disabled">
                  {t("results.situation.estimatedTime")}:{" "}
                  <span className="font-semibold text-accent-700">
                    {t("results.situation.minutes").replace("{n}", String(sc.estimatedMinutes))}
                  </span>
                </p>
              )}
            </div>

            {sc.documents.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold text-text-disabled uppercase tracking-wide mb-2">
                  {t("results.situation.documents")}
                </p>
                <div className="bg-white rounded-2xl border border-line-neutral divide-y divide-line-neutral">
                  {sc.documents.map((doc, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-4 py-3 text-[13px] text-text-primary">
                      <span>📄</span>
                      {doc}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sc.checklist.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold text-text-disabled uppercase tracking-wide mb-2">
                  {t("results.situation.checklist")}
                </p>
                <div className="bg-white rounded-2xl border border-line-neutral shadow-sm divide-y divide-line-neutral">
                  {sc.checklist.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-4 py-3 text-[13px] text-text-primary">
                      <span className="mt-0.5 text-accent-700 font-bold">✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {venue === "store" && (
              <div className="bg-gradient-to-br from-accent-50 to-pink-50 rounded-2xl border border-accent-100 p-4">
                <p className="text-[14px] font-bold text-text-primary mb-2">오프라인 결제 할인 체크</p>
                <ol className="flex flex-col gap-2 text-[13px] text-text-secondary list-decimal list-inside">
                  <li>올리브영 앱 가입 · CJ ONE 멤버십 연동</li>
                  <li>앱 쿠폰함에서 세일 쿠폰 다운로드</li>
                  <li>제휴카드·간편결제 프로모션 확인</li>
                  <li>매장에서 &apos;할인 다 적용하면 얼마예요?&apos; 확인</li>
                </ol>
              </div>
            )}

            {data.actions.length > 0 ? (
              <ActionStepper actions={data.actions} title={actionsTitle} t={t} />
            ) : (
              <div className="bg-infoBox rounded-2xl p-5 text-[13px] text-text-secondary text-center">
                행동 단계가 아직 없어요. 상황을 더 구체적으로 입력해보세요.
              </div>
            )}

            {data.phrases.length > 0 ? (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <ChatIcon />
                  <h2 className="text-[16px] font-bold text-text-primary">
                    {t("results.phrases.title")} ({data.phrases.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {data.phrases.map((ph, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-line-neutral shadow-sm p-4 relative">
                      <div className="absolute top-3 right-3">
                        <BookmarkBtn filled={phraseBookmarks.has(idx)} onToggle={() => phraseBookmarks.toggle(idx)} />
                      </div>
                      <p className="text-[15px] font-bold text-text-primary leading-snug pr-8">{ph.pronunciation}</p>
                      <p className="text-[13px] text-text-secondary mt-1">{ph.meaning}</p>
                      {ph.context && <p className="text-[11px] text-text-disabled mt-1.5 italic">{ph.context}</p>}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {data.tips.length > 0 ? (
              <TipsCarousel tips={data.tips} t={t} bookmarks={tipBookmarks} />
            ) : null}

            {systemContext && <ContextCallout ctx={systemContext} systemLabel={systemContextLabel} />}

            {insiderContexts.map((item: ContextCard, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-line-neutral p-4 shadow-sm">
                <p className="text-[14px] font-bold text-text-primary">{item.theme}</p>
                <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">{item.explanation}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab 2: Places (map, stores, similar products) ── */}
        {activeTab === "places" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-[17px] font-bold text-text-primary mb-1">{placesTitle}</h2>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                {venue === "store"
                  ? "방문할 매장 위치와 주변에서 비슷한 품목을 파는 곳을 확인하세요."
                  : "가까운 장소와 길 찾기 정보를 확인하세요."}
              </p>
            </div>

            {(hasPlaces || sc.whereTo.length > 0 || mapQuery) ? (
              <>
                <KakaoMap
                  query={mapQuery}
                  situation={situationLabel}
                  venue={venue}
                  additionalQueries={[
                    ...data.places.map((p) => p.nameKo ?? p.name),
                    ...sc.whereTo,
                  ]}
                />
                <div className="flex gap-2">
                  <a
                    href={`https://map.kakao.com/link/search/${encodeURIComponent(mapQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center rounded-xl border border-line-neutral bg-white py-2.5 text-[13px] font-semibold text-text-primary hover:bg-infoBox transition-colors"
                  >
                    {t("results.mapKakao")}
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery + " 한국")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center rounded-xl border border-line-neutral bg-white py-2.5 text-[13px] font-semibold text-text-primary hover:bg-infoBox transition-colors"
                  >
                    {t("results.mapGoogle")}
                  </a>
                </div>
                <div className="bg-white rounded-2xl border border-line-neutral shadow-sm px-4">
                  {hasPlaces && (
                    <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-wide pt-3 pb-1">
                      가이드에서 추천한 장소
                    </p>
                  )}
                  {hasPlaces
                    ? data.places.map((p, idx) => (
                        <div key={idx}>
                          <PlaceRow place={p} t={t} />
                          {CULTURE_ENABLED && idx === 0 && (
                            <div className="pb-3"><CultureEvents placeName={p.name} t={t} /></div>
                          )}
                        </div>
                      ))
                    : sc.whereTo.map((place, i) => (
                        <div key={i} className="flex items-center py-3.5 border-b border-line-neutral last:border-0">
                          <p className="text-[14px] font-medium text-text-primary">{place}</p>
                        </div>
                      ))}
                </div>
              </>
            ) : (
              <div className="bg-infoBox rounded-2xl p-5 text-[13px] text-text-secondary text-center">
                {t("results.places.empty")}
              </div>
            )}

            {(venue === "store" || productQueries.length > 0) && (
              <OliveYoungProducts queries={productQueries} />
            )}

            <button type="button" onClick={onBack} className="text-[12px] text-text-tertiary underline self-start">
              {t("results.places.changeLocation")}
            </button>
          </div>
        )}

        {/* ── Tab 3: Action memo (trends + URL save + memos) ── */}
        {activeTab === "memo" && (
          <div className="flex flex-col gap-6">
            <TrendsSection situationLabel={situationLabel} venue={venue} />
            <ShoppingMemoPanel
              products={data.products ?? []}
              situation={situationLabel}
              sourceUrl={sourceUrl}
              videoTitle={data.video.title}
              extraction={data}
            />
            <VideoResearchPrompts situation={situationLabel} />
          </div>
        )}
      </div>
    </div>
  );
}
