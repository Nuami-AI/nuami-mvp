"use client";

import { useState } from "react";
import type { TranslationKey } from "@/lib/i18n";
import type { ResultVenue } from "@/lib/results/venue-context";
import type { ContextCard, ExtractionResult, Tip } from "@/types/extraction";
import ActionMemoPanel from "@/components/ActionMemoPanel";
import GuideHero from "@/components/GuideHero";
import OliveYoungProducts from "@/components/OliveYoungProducts";
import PlacesMap from "@/components/PlacesMap";
import SaveableItemCard, { InfoItemCard } from "@/components/SaveableItemCard";
import { SectionCard } from "@/components/ui/section-card";
import { detectDestinationCountry, usesKakaoMap } from "@/lib/geo/destination-country";
import { isShoppingContext } from "@/lib/results/venue-context";
import {
  ActionStepper,
  ContextCallout,
} from "@/components/results-shared";

type ResultsTab = "guide" | "places" | "memo";

const TABS: { id: ResultsTab; labelKey: TranslationKey }[] = [
  { id: "guide", labelKey: "results.tab.guide" },
  { id: "places", labelKey: "results.tab.places" },
  { id: "memo", labelKey: "results.tab.memo" },
];

function tipEmoji(cat: Tip["cat"]) {
  const map: Record<Tip["cat"], string> = {
    Time: "⏰", Price: "💰", Etiquette: "🙏", Transport: "🚇", Other: "💡",
  };
  return map[cat] ?? "💡";
}

interface Props {
  data: ExtractionResult;
  situationLabel: string;
  venue: ResultVenue;
  placesTitle: string;
  actionsTitle: string;
  systemContextLabel: string;
  mapQuery: string;
  destinationCountry?: string | null;
  sourceUrl?: string;
  onBack: () => void;
  t: (k: TranslationKey) => string;
}

export default function ResultsTabLayout({
  data,
  situationLabel,
  venue,
  placesTitle,
  actionsTitle,
  systemContextLabel,
  mapQuery,
  destinationCountry,
  sourceUrl,
  onBack,
  t,
}: Props) {
  const [activeTab, setActiveTab] = useState<ResultsTab>("guide");
  const sc = data.situation;
  const systemContext = data.contexts?.[0];
  const insiderContexts = data.contexts?.slice(1) ?? [];
  const products = data.products ?? [];
  const shoppingContext = isShoppingContext(venue, products.length);
  const oliveYoungQueries = products.map((p) => p.searchQuery ?? p.name).filter(Boolean);
  const destination = detectDestinationCountry(situationLabel, destinationCountry);
  const showKakaoLinks = usesKakaoMap(destination);
  const videoTitle = data.video.title;

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
                className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold border-2 transition-colors ${
                  isActive
                    ? "bg-accent-700 text-white border-accent-700 shadow-md"
                    : "bg-white text-text-secondary border-line-neutral hover:border-accent-300"
                }`}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 px-4 lg:px-0">
        {activeTab === "guide" && (
          <div className="flex flex-col gap-5">
            <GuideHero
              situationLabel={situationLabel}
              summary={sc.summary}
              venue={venue}
              actions={data.actions}
              estimatedMinutes={sc.estimatedMinutes}
            />

            {sc.documents.length > 0 && (
              <SectionCard icon="📄" title={t("results.situation.documents")} accent="blue">
                <div className="p-3 space-y-2">
                  {sc.documents.map((doc, i) => (
                    <InfoItemCard key={i} title={doc} emoji="📄" />
                  ))}
                </div>
              </SectionCard>
            )}

            {sc.checklist.length > 0 && (
              <SectionCard icon="✅" title={t("results.situation.checklist")} accent="green">
                <div className="p-3 space-y-2">
                  {sc.checklist.map((item, i) => (
                    <InfoItemCard key={i} title={item} emoji="✓" highlight={i === 0} />
                  ))}
                </div>
              </SectionCard>
            )}

            {venue === "store" && (
              <SectionCard icon="💳" title="오프라인 결제 할인 체크" accent="amber">
                <div className="p-3 grid grid-cols-2 gap-2">
                  {["앱 가입 · 멤버십", "쿠폰 다운로드", "제휴카드 확인", "매장 할인 확인"].map((label) => (
                    <div
                      key={label}
                      className="rounded-xl border-2 border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] font-semibold text-amber-900 text-center"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {data.actions.length > 0 ? (
              <ActionStepper actions={data.actions} title={actionsTitle} t={t} />
            ) : (
              <div className="bg-infoBox rounded-2xl border-2 border-line-neutral p-5 text-[13px] text-text-secondary text-center">
                행동 단계가 아직 없어요. 상황을 더 구체적으로 입력해보세요.
              </div>
            )}

            {data.phrases.length > 0 && (
              <SectionCard icon="💬" title={`${t("results.phrases.title")} (${data.phrases.length})`} accent="purple">
                <div className="p-3 space-y-2">
                  {data.phrases.map((ph, idx) => (
                    <SaveableItemCard
                      key={idx}
                      type="phrase"
                      title={ph.pronunciation}
                      body={[ph.meaning, ph.context].filter(Boolean).join(" · ")}
                      situation={situationLabel}
                      sourceUrl={sourceUrl}
                      videoTitle={videoTitle}
                      emoji="💬"
                      saveable
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {data.tips.length > 0 && (
              <SectionCard icon="💡" title={t("results.tips.title")} accent="amber">
                <div className="p-3 space-y-2">
                  {data.tips.map((tip, idx) => (
                    <InfoItemCard
                      key={idx}
                      title={tip.title}
                      body={tip.desc}
                      emoji={tipEmoji(tip.cat)}
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {systemContext && <ContextCallout ctx={systemContext} systemLabel={systemContextLabel} />}

            {insiderContexts.map((item: ContextCard, idx) => (
              <div key={idx} className="bg-white rounded-2xl border-2 border-line-neutral p-4 shadow-sm">
                <p className="text-[14px] font-bold text-text-primary">{item.theme}</p>
                <p className="text-[12px] text-text-secondary mt-1 leading-relaxed line-clamp-4">{item.explanation}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "places" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-[17px] font-bold text-text-primary mb-1">{placesTitle}</h2>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                가까운 장소와 길 찾기 정보를 확인하세요.
              </p>
            </div>

            {(sc.whereTo.length > 0 || mapQuery) ? (
              <>
                <PlacesMap
                  situation={situationLabel}
                  venue={venue}
                  mapQuery={mapQuery}
                  destinationCountry={destinationCountry}
                  places={[]}
                  whereTo={sc.whereTo}
                />
                <div className="flex gap-2">
                  {showKakaoLinks ? (
                    <a
                      href={`https://map.kakao.com/link/search/${encodeURIComponent(mapQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center rounded-xl border-2 border-line-neutral bg-white py-2.5 text-[13px] font-semibold text-text-primary hover:bg-infoBox transition-colors"
                    >
                      {t("results.mapKakao")}
                    </a>
                  ) : null}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      mapQuery + (showKakaoLinks ? " 한국" : ""),
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${showKakaoLinks ? "flex-1" : "w-full"} text-center rounded-xl border-2 border-line-neutral bg-white py-2.5 text-[13px] font-semibold text-text-primary hover:bg-infoBox transition-colors`}
                  >
                    {t("results.mapGoogle")}
                  </a>
                </div>
                {sc.whereTo.length > 0 && (
                  <div className="bg-white rounded-2xl border-2 border-line-neutral shadow-sm p-3 space-y-2">
                    {sc.whereTo.map((place, i) => (
                      <SaveableItemCard
                        key={i}
                        type="place"
                        title={place}
                        situation={situationLabel}
                        sourceUrl={sourceUrl}
                        videoTitle={videoTitle}
                        emoji="📍"
                        saveable
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-infoBox rounded-2xl border-2 border-line-neutral p-5 text-[13px] text-text-secondary text-center">
                {t("results.places.empty")}
              </div>
            )}

            {shoppingContext && oliveYoungQueries.length > 0 && (
              <OliveYoungProducts queries={oliveYoungQueries} />
            )}

            <button type="button" onClick={onBack} className="text-[12px] text-text-tertiary underline self-start">
              {t("results.places.changeLocation")}
            </button>
          </div>
        )}

        {activeTab === "memo" && (
          <ActionMemoPanel
            data={data}
            situation={situationLabel}
            venue={venue}
            sourceUrl={sourceUrl}
            showShoppingExtras={shoppingContext}
          />
        )}
      </div>
    </div>
  );
}
