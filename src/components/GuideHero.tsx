"use client";

import type { ActionStep } from "@/types/extraction";
import type { ResultVenue } from "@/lib/results/venue-context";
import { getEncouragementMessage, summarizeToBullets } from "@/lib/results/encouragement";

interface Props {
  situationLabel: string;
  summary: string;
  venue: ResultVenue;
  actions: ActionStep[];
  estimatedMinutes?: number;
}

function ProcessFlow({ actions }: { actions: ActionStep[] }) {
  const steps = actions.slice(0, 5);
  if (steps.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-[12px] font-bold text-text-secondary mb-3">👣 진행 순서</p>
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {steps.map((step, idx) => {
          const isFirst = idx === 0;
          return (
            <div key={step.step} className="flex items-center shrink-0">
              <div
                className={`flex flex-col items-center w-[88px] rounded-xl border-2 px-2 py-2.5 ${
                  isFirst
                    ? "border-accent-700 bg-accent-700 text-white shadow-md"
                    : "border-line-neutral bg-white text-text-primary"
                }`}
              >
                <span className={`text-[10px] font-bold ${isFirst ? "text-accent-100" : "text-accent-700"}`}>
                  STEP {step.step}
                </span>
                <p className={`text-[11px] font-semibold mt-1 text-center leading-tight line-clamp-3 ${isFirst ? "text-white" : ""}`}>
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
  const encouragement = getEncouragementMessage(situationLabel, venue);
  const bullets = summarizeToBullets(summary, 3);

  return (
    <div className="rounded-2xl border-2 border-accent-200 bg-gradient-to-br from-accent-50 via-white to-blue-50 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b-2 border-accent-100">
        <p className="text-[13px] font-semibold text-accent-800 leading-relaxed">{encouragement}</p>
      </div>

      <div className="px-4 py-3">
        <p className="text-[11px] font-bold text-text-disabled uppercase tracking-wide mb-2">📋 요약</p>
        <ul className="space-y-1.5">
          {bullets.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-text-primary font-medium">
              <span className="text-accent-700 shrink-0">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {estimatedMinutes !== undefined && (
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-[12px] font-bold text-amber-900">
            ⏱ 약 {estimatedMinutes}분
          </p>
        )}
      </div>

      <div className="px-4 pb-4">
        <ProcessFlow actions={actions} />
      </div>
    </div>
  );
}
