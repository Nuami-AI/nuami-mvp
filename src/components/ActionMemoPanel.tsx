"use client";

import { useState } from "react";
import Link from "next/link";

import { useSaves } from "@/lib/saves/hooks";
import { useLanguage } from "@/lib/i18n";
import type { ResultVenue } from "@/lib/results/venue-context";
import type { ExtractionResult } from "@/types/extraction";
import ShoppingMemoPanel from "@/components/ShoppingMemoPanel";
import SessionMemoBox from "@/components/SessionMemoBox";
import VideoResearchPrompts from "@/components/VideoResearchPrompts";

interface Props {
  data: ExtractionResult;
  situation: string;
  venue: ResultVenue;
  sourceUrl?: string;
  showShoppingExtras?: boolean;
}

function GeneralMemoPanel({
  data,
  situation,
  sourceUrl,
  videoTitle,
}: {
  data: ExtractionResult;
  situation: string;
  sourceUrl?: string;
  videoTitle?: string;
}) {
  const { t } = useLanguage();
  const { save, items } = useSaves();
  const [guideSaved, setGuideSaved] = useState(false);
  const sc = data.situation;

  const handleSaveGuide = () => {
    save({
      type: "guide",
      title: situation,
      body: sc.summary,
      memo: "",
      checked: false,
      situation,
      sourceUrl,
      videoTitle,
      payload: data,
    });
    setGuideSaved(true);
  };

  const savedCount = items.length;

  return (
    <div className="flex flex-col gap-4">
      <SessionMemoBox situation={situation} sourceUrl={sourceUrl} videoTitle={videoTitle} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSaveGuide}
          disabled={guideSaved}
          className="flex-1 rounded-xl border border-accent-700 bg-accent-50 text-accent-800 text-[13px] font-semibold py-2.5 disabled:opacity-50"
        >
          {guideSaved ? t("memo.guideSaved") : t("memo.saveGuide")}
        </button>
        <Link
          href="/saved"
          className="flex-1 rounded-xl border border-line-neutral bg-white text-text-primary text-[13px] font-semibold py-2.5 text-center"
        >
          {t("memo.myList")} ({savedCount})
        </Link>
      </div>

      {sc.checklist.length > 0 && (
        <div className="bg-white rounded-2xl border border-line-neutral shadow-sm divide-y divide-line-neutral">
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-text-disabled uppercase tracking-wide">
            ✓ {t("results.situation.checklist")}
          </p>
          {sc.checklist.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 px-4 py-3 text-[13px] text-text-primary">
              <span className="text-accent-700">□</span>
              {item}
            </div>
          ))}
        </div>
      )}

      {data.actions.length > 0 && (
        <div className="bg-white rounded-2xl border border-line-neutral shadow-sm divide-y divide-line-neutral">
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-text-disabled uppercase tracking-wide">
            👣 행동 순서
          </p>
          {data.actions.map((step) => (
            <div key={step.step} className="flex items-start gap-2.5 px-4 py-3">
              <span className="text-[11px] font-bold text-accent-700 shrink-0">{step.step}</span>
              <div>
                <p className="text-[13px] font-semibold text-text-primary">{step.action}</p>
                {step.detail && (
                  <p className="text-[12px] text-text-secondary mt-0.5">{step.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.tips.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-semibold text-text-disabled uppercase tracking-wide">💡 {t("results.tips.title")}</p>
          {data.tips.slice(0, 5).map((tip, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-line-neutral p-4 shadow-sm">
              <p className="text-[13px] font-bold text-text-primary">{tip.title}</p>
              <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      )}

      {data.phrases.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-semibold text-text-disabled uppercase tracking-wide">💬 {t("results.phrases.title")}</p>
          {data.phrases.slice(0, 5).map((ph, idx) => (
            <div key={idx} className="bg-accent-50 rounded-2xl border border-accent-100 p-4">
              <p className="text-[14px] font-bold text-text-primary">{ph.pronunciation}</p>
              <p className="text-[12px] text-text-secondary mt-1">{ph.meaning}</p>
            </div>
          ))}
        </div>
      )}

      {sc.documents.length > 0 && (
        <div className="bg-white rounded-2xl border border-line-neutral shadow-sm divide-y divide-line-neutral">
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-text-disabled uppercase tracking-wide">
            📄 {t("results.situation.documents")}
          </p>
          {sc.documents.map((doc, i) => (
            <div key={i} className="px-4 py-3 text-[13px] text-text-primary">{doc}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ActionMemoPanel({
  data,
  situation,
  venue,
  sourceUrl,
  showShoppingExtras = false,
}: Props) {
  if (showShoppingExtras) {
    return (
      <div className="flex flex-col gap-6">
        <SessionMemoBox situation={situation} sourceUrl={sourceUrl} videoTitle={data.video.title} />
        <ShoppingMemoPanel
          products={data.products ?? []}
          situation={situation}
          sourceUrl={sourceUrl}
          videoTitle={data.video.title}
          extraction={data}
        />
        <VideoResearchPrompts situation={situation} venue={venue} />
      </div>
    );
  }

  return <GeneralMemoPanel data={data} situation={situation} sourceUrl={sourceUrl} videoTitle={data.video.title} />;
}
