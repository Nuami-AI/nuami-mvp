"use client";

import type { ActionStep } from "@/types/extraction";
import type { ResultVenue } from "@/lib/results/venue-context";
import { getEncouragementMessage, summarizeToBullets } from "@/lib/results/encouragement";
import { useLanguage } from "@/lib/i18n";
import { StatusBubble, type StatusTone } from "@/components/ui/status-bubble";

interface Props {
  situationLabel: string;
  summary: string;
  venue: ResultVenue;
  actions: ActionStep[];
  estimatedMinutes?: number;
}

function ProcessFlow({ actions }: { actions: ActionStep[] }) {
  const { t } = useLanguage();
  const stageOrder = ["prepare", "move", "apply", "confirm"] as const;
  const hasStages = actions.some((step) => step.stage);
  const steps = hasStages
    ? stageOrder.map((stage, idx) => ({
        step: idx + 1,
        action: t(`results.stage.${stage}` as Parameters<typeof t>[0]),
      }))
    : actions.slice(0, 5);
  if (steps.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-[12px] font-bold text-text-secondary mb-3">{t("guide.hero.processOrder")}</p>
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {steps.map((step, idx) => {
          const stage = hasStages ? stageOrder[idx] : null;
          const tone: StatusTone = !stage
            ? idx === 0
              ? "ready"
              : idx === steps.length - 1
                ? "done"
                : "progress"
            : stage === "prepare"
              ? "ready"
              : stage === "confirm"
                ? "done"
                : "progress";
          return (
            <div key={step.step} className="flex items-center shrink-0">
              <div className="flex w-[88px] flex-col items-center rounded-xl border border-line-neutral bg-white px-2 py-2.5 text-text-primary">
                <StatusBubble tone={tone} className="mb-1">
                  STEP {step.step}
                </StatusBubble>
                <p className="mt-1 line-clamp-3 text-center text-[11px] font-semibold leading-tight">
                  {step.action}
                </p>
              </div>
              {idx < steps.length - 1 && (
                <span className="text-text-disabled px-0.5 text-sm">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GuideHero({ situationLabel, summary, venue, actions, estimatedMinutes }: Props) {
  const { t } = useLanguage();
  const encouragement = getEncouragementMessage(situationLabel, venue);
  const bullets = summarizeToBullets(summary, 3);

  return (
    <div className="rounded-2xl border-2 border-line-neutral bg-white shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-line-neutral">
        <p className="text-[13px] font-semibold text-text-primary leading-relaxed">{encouragement}</p>
      </div>

      <div className="px-4 py-3">
        <p className="text-[11px] font-bold text-text-disabled uppercase tracking-wide mb-2">{t("guide.hero.summary")}</p>
        <ul className="space-y-1.5">
          {bullets.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-text-primary font-medium">
              <span className="text-text-primary shrink-0">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {estimatedMinutes !== undefined && (
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-[12px] font-bold text-text-primary">
            {t("guide.hero.minutes").replace("{n}", String(estimatedMinutes))}
          </p>
        )}
      </div>

      <div className="px-4 pb-4">
        <ProcessFlow actions={actions} />
      </div>
    </div>
  );
}
