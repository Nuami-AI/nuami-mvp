"use client";

import type { TranslationKey } from "@/lib/i18n";
import type { ExtractionResult } from "@/types/extraction";
import SaveableItemCard, { InfoItemCard } from "@/components/SaveableItemCard";
import { SectionCard } from "@/components/ui/section-card";
import { ActionStepper, ContextCallout } from "@/components/results-shared";
import GuideFeedback from "@/components/guide/GuideFeedback";
import PublicDataPanel from "@/components/guide/PublicDataPanel";
import { isPhysicalPlaceName } from "@/lib/geo/region";

function tipEmoji(cat: ExtractionResult["tips"][number]["cat"]) {
  const map: Record<ExtractionResult["tips"][number]["cat"], string> = {
    Time: "⏰", Price: "💰", Etiquette: "🙏", Transport: "🚇", Other: "💡",
  };
  return map[cat] ?? "💡";
}

interface Props {
  data: ExtractionResult;
  situationLabel: string;
  actionsTitle: string;
  systemContextLabel: string;
  sourceUrl?: string;
  t: (k: TranslationKey) => string;
}

export default function ThreeCardGuide({
  data,
  situationLabel,
  actionsTitle,
  systemContextLabel,
  sourceUrl,
  t,
}: Props) {
  const sc = data.situation;
  const pipeline = data.pipeline;
  const systemContext = data.contexts?.[0];
  const insiderContexts = data.contexts?.slice(1) ?? [];
  const videoTitle = data.video.title;
  const visitPlaces = sc.whereTo.filter((place) => isPhysicalPlaceName(place));

  return (
    <div className="flex flex-col gap-5">
      {pipeline && (
        <div className="rounded-2xl border-2 border-accent-100 bg-accent-50 px-4 py-3">
          <p className="text-[11px] font-bold text-accent-800 tracking-wide">
            {t("results.pipeline.badge")}
          </p>
          <p className="text-[12px] text-accent-900 mt-1">
            {t("input.pipeline.search")} → {t("input.pipeline.reason")} → {t("input.pipeline.generate")}
          </p>
          {pipeline.generate.grounded && pipeline.asOf && (
            <p className="text-[11px] text-text-secondary mt-1">
              {t("results.source.verified")} · {t("results.source.asOf").replace("{date}", pipeline.asOf)}
            </p>
          )}
          {pipeline.institution?.reused && (
            <p className="text-[11px] text-accent-800 mt-1">
              {t("results.institution.reused").replace("{name}", pipeline.institution.name)}
            </p>
          )}
        </div>
      )}

      <SectionCard icon="①" title={t("results.card.situation")} accent="blue">
        <div className="p-3 space-y-3">
          <p className="text-[13px] text-text-primary leading-relaxed">{sc.summary}</p>
          {sc.documents.length > 0 && (
            <div>
              <p className="text-[12px] font-bold text-text-secondary mb-2">{t("results.situation.documents")}</p>
              <div className="space-y-2">
                {sc.documents.map((doc, i) => (
                  <InfoItemCard key={i} title={doc} emoji="📄" />
                ))}
              </div>
            </div>
          )}
          {visitPlaces.length > 0 && (
            <div>
              <p className="text-[12px] font-bold text-text-secondary mb-2">{t("results.situation.whereTo")}</p>
              <div className="space-y-2">
                {visitPlaces.map((place, i) => (
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
            </div>
          )}
          {sc.checklist.length > 0 && (
            <div>
              <p className="text-[12px] font-bold text-text-secondary mb-2">{t("results.situation.checklist")}</p>
              <div className="space-y-2">
                {sc.checklist.map((item, i) => (
                  <InfoItemCard key={i} title={item} emoji="✓" highlight={i === 0} />
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {pipeline?.openData && <PublicDataPanel openData={pipeline.openData} t={t} />}

      {data.actions.length > 0 ? (
        <ActionStepper actions={data.actions} title={`② ${actionsTitle}`} t={t} />
      ) : (
        <div className="bg-infoBox rounded-2xl border-2 border-line-neutral p-5 text-[13px] text-text-secondary text-center">
          행동 단계가 아직 없어요. 상황을 더 구체적으로 입력해보세요.
        </div>
      )}

      <SectionCard icon="③" title={t("results.card.context")} accent="purple">
        <div className="p-3 space-y-3">
          {data.phrases.length > 0 && (
            <div className="space-y-2">
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
          )}
          {data.tips.length > 0 && (
            <div className="space-y-2">
              {data.tips.map((tip, idx) => (
                <InfoItemCard
                  key={idx}
                  title={tip.title}
                  body={tip.desc}
                  emoji={tipEmoji(tip.cat)}
                />
              ))}
            </div>
          )}
          {systemContext && <ContextCallout ctx={systemContext} systemLabel={systemContextLabel} />}
          {insiderContexts.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl border-2 border-line-neutral p-4 shadow-sm">
              <p className="text-[14px] font-bold text-text-primary">{item.theme}</p>
              <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">{item.explanation}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {pipeline?.sources && pipeline.sources.length > 0 && (
        <p className="text-[11px] text-text-tertiary leading-relaxed px-1">
          {pipeline.sources.map((s) => s.name).join(" · ")}
        </p>
      )}

      <GuideFeedback
        situation={situationLabel}
        scenarioId={pipeline?.search.scenarioId}
        t={t}
      />
    </div>
  );
}
