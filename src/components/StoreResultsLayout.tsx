"use client";

import { useState } from "react";
import Link from "next/link";
import type { TranslationKey } from "@/lib/i18n";
import { K_BEAUTY_TRENDS } from "@/lib/shopping/video-research";
import type { ExtractionResult } from "@/types/extraction";
import VideoResearchPrompts from "@/components/VideoResearchPrompts";
import {
  ActionStepper,
  ContextCallout,
  MapPlaceholder,
  PlaceRow,
  TipsCarousel,
  useBookmarkSet,
} from "@/components/results-shared";

type StoreTab = "location" | "actions" | "prep" | "trend";

const TABS: { id: StoreTab; label: string }[] = [
  { id: "location", label: "매장위치" },
  { id: "actions", label: "행동방법" },
  { id: "prep", label: "미리준비" },
  { id: "trend", label: "지금 한국의 트렌드는?" },
];

interface Props {
  data: ExtractionResult;
  situationLabel: string;
  placesTitle: string;
  actionsTitle: string;
  systemContextLabel: string;
  mapQuery: string;
  hasPlaces: boolean;
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

export default function StoreResultsLayout({
  data,
  situationLabel,
  placesTitle,
  actionsTitle,
  systemContextLabel,
  mapQuery,
  hasPlaces,
  onBack,
  t,
}: Props) {
  const [activeTab, setActiveTab] = useState<StoreTab>("location");
  const tipBookmarks = useBookmarkSet();
  const sc = data.situation;
  const systemContext = data.contexts?.[0];
  const insiderContexts = data.contexts?.slice(1) ?? [];

  return (
    <div className="mt-6">
      <div className="px-4 lg:px-0 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max pb-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                  isActive ? "bg-accent-700 text-white" : "bg-infoBox text-text-secondary hover:bg-accent-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 px-4 lg:px-0">
        {activeTab === "location" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-[17px] font-bold text-text-primary mb-1">{placesTitle}</h2>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                방문할 매장 위치를 확인하고, 지도에서 길을 찾아보세요.
              </p>
            </div>
            <MapPlaceholder query={mapQuery} />
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
            {(hasPlaces || sc.whereTo.length > 0) && (
              <div className="bg-white rounded-2xl border border-line-neutral shadow-sm px-4">
                {hasPlaces
                  ? data.places.map((p, idx) => <PlaceRow key={idx} place={p} t={t} />)
                  : sc.whereTo.map((place, i) => (
                      <div key={i} className="flex items-center py-3.5 border-b border-line-neutral last:border-0">
                        <p className="text-[14px] font-medium text-text-primary">{place}</p>
                      </div>
                    ))}
              </div>
            )}
            {sc.estimatedMinutes !== undefined && (
              <div className="bg-accent-50 rounded-2xl border border-accent-100 px-4 py-3">
                <p className="text-[12px] text-accent-800">
                  {t("results.situation.estimatedTime")}:{" "}
                  <span className="font-bold">
                    {t("results.situation.minutes").replace("{n}", String(sc.estimatedMinutes))}
                  </span>
                </p>
              </div>
            )}
            <button type="button" onClick={onBack} className="text-[12px] text-text-tertiary underline self-start">
              {t("results.places.changeLocation")}
            </button>
          </div>
        )}

        {activeTab === "actions" && (
          <div className="flex flex-col gap-6">
            {data.actions.length > 0 ? (
              <ActionStepper actions={data.actions} title={actionsTitle} t={t} />
            ) : (
              <div className="bg-infoBox rounded-2xl p-5 text-[13px] text-text-secondary text-center">
                행동 단계가 아직 없어요. 상황을 더 구체적으로 입력해보세요.
              </div>
            )}

            {data.phrases.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <ChatIcon />
                  <h2 className="text-[16px] font-bold text-text-primary">
                    {t("results.phrases.title")} ({data.phrases.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {data.phrases.map((ph, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-line-neutral shadow-sm p-4">
                      <p className="text-[15px] font-bold text-text-primary leading-snug">{ph.pronunciation}</p>
                      <p className="text-[13px] text-text-secondary mt-1">{ph.meaning}</p>
                      {ph.context && <p className="text-[11px] text-text-disabled mt-1.5 italic">{ph.context}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <VideoResearchPrompts situation={situationLabel} />
          </div>
        )}

        {activeTab === "prep" && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-[17px] font-bold text-text-primary mb-1">미리준비</h2>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                매장 가기 전에 챙길 것·앱 쿠폰·멤버십·제휴카드를 미리 확인하세요.
              </p>
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
            <div className="bg-gradient-to-br from-accent-50 to-pink-50 rounded-2xl border border-accent-100 p-4">
              <p className="text-[14px] font-bold text-text-primary mb-2">오프라인 결제 할인 체크</p>
              <ol className="flex flex-col gap-2 text-[13px] text-text-secondary list-decimal list-inside">
                <li>올리브영 앱 가입 · CJ ONE 멤버십 연동</li>
                <li>앱 쿠폰함에서 세일 쿠폰 다운로드</li>
                <li>제휴카드·간편결제 프로모션 확인</li>
                <li>매장에서 &apos;할인 다 적용하면 얼마예요?&apos; 확인</li>
              </ol>
            </div>
            {data.tips.length > 0 ? (
              <TipsCarousel tips={data.tips} t={t} bookmarks={tipBookmarks} />
            ) : (
              <div className="bg-infoBox rounded-2xl p-4 text-[13px] text-text-tertiary text-center">{t("results.tips.empty")}</div>
            )}
            {systemContext && <ContextCallout ctx={systemContext} systemLabel={systemContextLabel} />}
            {insiderContexts.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-line-neutral p-4 shadow-sm">
                <p className="text-[14px] font-bold text-text-primary">{item.theme}</p>
                <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">{item.explanation}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "trend" && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-[17px] font-bold text-text-primary mb-1">지금 한국의 트렌드는?</h2>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                한국 뷰티는 <span className="font-semibold text-accent-700">나노 단위</span>로 세분화돼요.
                쿨톤·웜톤, 글로시·매트 제형, 아이돌 메이크업을 함께 보면 지금 뭘 사야 할지 보입니다.
              </p>
            </div>
            {K_BEAUTY_TRENDS.map((block) => (
              <div key={block.id} className="bg-white rounded-2xl border border-line-neutral shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-accent-50 to-pink-50 px-4 py-3 border-b border-line-neutral">
                  <p className="text-[14px] font-bold text-text-primary">{block.label}</p>
                </div>
                <ul className="px-4 py-3 flex flex-col gap-2">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-text-secondary">
                      <span className="text-accent-600 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="px-4 pb-3 text-[12px] text-text-tertiary leading-relaxed border-t border-line-neutral pt-2">
                  💡 {block.hint}
                </p>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: "🩷", label: "쿨톤·로즈", sub: "베리 틴트" },
                { emoji: "🧡", label: "웜톤·코랄", sub: "피치 블러셔" },
                { emoji: "💧", label: "글로시", sub: "광택 립" },
                { emoji: "🌫️", label: "매트", sub: "보송 베이스" },
              ].map((v) => (
                <div key={v.label} className="rounded-2xl bg-gradient-to-br from-accent-100 to-white border border-line-neutral p-4 text-center">
                  <span className="text-3xl">{v.emoji}</span>
                  <p className="text-[13px] font-bold text-text-primary mt-2">{v.label}</p>
                  <p className="text-[11px] text-text-tertiary">{v.sub}</p>
                </div>
              ))}
            </div>
            <div className="bg-infoBox rounded-2xl border border-line-neutral p-4">
              <p className="text-[13px] font-semibold text-text-primary mb-1">유행에 맞는 사진·영상을 확인할까요?</p>
              <p className="text-[12px] text-text-secondary leading-relaxed mb-3">
                아이돌·뷰티 유튜버 영상을 뉴아미로 요약하면 지금 한국에서 뜨는 색감과 제형을 한눈에 볼 수 있어요.
              </p>
              <Link
                href={`/guide/video-links?topic=trend&situation=${encodeURIComponent(situationLabel)}`}
                className="inline-flex items-center justify-center w-full rounded-xl bg-accent-700 text-white text-[13px] font-semibold py-3 hover:bg-accent-800 transition-colors"
              >
                유행 영상 목록 만들기 →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
