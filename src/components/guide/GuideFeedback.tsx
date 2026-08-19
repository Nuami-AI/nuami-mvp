"use client";

import { useState } from "react";
import type { TranslationKey } from "@/lib/i18n";

interface Props {
  situation: string;
  scenarioId?: string;
  t: (k: TranslationKey) => string;
}

async function logUsage(action: "guide_completed" | "guide_rated", metadata: object) {
  await fetch("/api/usage/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, metadata }),
  }).catch(() => {});
}

export default function GuideFeedback({ situation, scenarioId, t }: Props) {
  const [rated, setRated] = useState<"helpful" | "unclear" | null>(null);
  const [completed, setCompleted] = useState(false);

  return (
    <div className="rounded-2xl border-2 border-line-neutral bg-white p-4 space-y-3">
      <p className="text-[13px] font-bold text-text-primary">{t("results.feedback.prompt")}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={rated !== null}
          onClick={() => {
            setRated("helpful");
            void logUsage("guide_rated", { situation, scenarioId, rating: "helpful" });
          }}
          className={`flex-1 rounded-xl border-2 py-2.5 text-[13px] font-semibold ${
            rated === "helpful"
              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
              : "border-line-neutral bg-white text-text-primary"
          }`}
        >
          {t("results.feedback.helpful")}
        </button>
        <button
          type="button"
          disabled={rated !== null}
          onClick={() => {
            setRated("unclear");
            void logUsage("guide_rated", { situation, scenarioId, rating: "unclear" });
          }}
          className={`flex-1 rounded-xl border-2 py-2.5 text-[13px] font-semibold ${
            rated === "unclear"
              ? "border-amber-500 bg-amber-50 text-amber-900"
              : "border-line-neutral bg-white text-text-primary"
          }`}
        >
          {t("results.feedback.unclear")}
        </button>
      </div>
      {rated && <p className="text-[12px] text-text-secondary">{t("results.feedback.thanks")}</p>}
      <button
        type="button"
        disabled={completed}
        onClick={() => {
          setCompleted(true);
          void logUsage("guide_completed", { situation, scenarioId });
        }}
        className={`w-full rounded-xl py-2.5 text-[13px] font-bold border-2 ${
          completed
            ? "border-accent-700 bg-accent-700 text-white"
            : "border-accent-700 text-accent-700 bg-accent-50"
        }`}
      >
        {completed ? t("results.feedback.done") : t("results.feedback.complete")}
      </button>
    </div>
  );
}
