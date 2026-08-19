"use client";

import type { TranslationKey } from "@/lib/i18n";

interface Props {
  active: "search" | "reason" | "generate";
  t: (k: TranslationKey) => string;
}

const STEPS: Array<{ id: "search" | "reason" | "generate"; key: TranslationKey }> = [
  { id: "search", key: "input.pipeline.search" },
  { id: "reason", key: "input.pipeline.reason" },
  { id: "generate", key: "input.pipeline.generate" },
];

export default function PipelineLoading({ active, t }: Props) {
  const order = { search: 0, reason: 1, generate: 2 };
  const activeIdx = order[active];

  return (
    <div className="rounded-2xl border-2 border-accent-200 bg-white p-4 shadow-sm">
      <p className="text-[12px] font-bold text-accent-700 mb-3">{t("input.pipeline.title")}</p>
      <div className="flex items-center gap-2">
        {STEPS.map((step, idx) => {
          const done = idx < activeIdx;
          const current = idx === activeIdx;
          return (
            <div key={step.id} className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={`flex-1 rounded-xl px-2 py-2 text-center text-[11px] font-semibold border-2 ${
                  current
                    ? "border-accent-700 bg-accent-50 text-accent-800"
                    : done
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-line-neutral bg-background text-text-tertiary"
                }`}
              >
                {t(step.key)}
              </div>
              {idx < STEPS.length - 1 && <span className="text-text-disabled text-xs">→</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
