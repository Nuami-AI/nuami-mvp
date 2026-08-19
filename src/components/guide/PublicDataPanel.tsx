"use client";

import type { TranslationKey } from "@/lib/i18n";
import type { GuidePipelineMeta } from "@/types/extraction";
import { SectionCard } from "@/components/ui/section-card";

interface Props {
  openData: NonNullable<GuidePipelineMeta["openData"]>;
  t: (k: TranslationKey) => string;
}

export default function PublicDataPanel({ openData, t }: Props) {
  if (openData.facilities.length === 0) return null;

  return (
    <SectionCard icon="🏛️" title={t("results.opendata.title")} accent="green">
      <div className="p-3 space-y-2">
        <p className="text-[12px] text-text-secondary leading-relaxed">
          {openData.live ? t("results.opendata.live") : t("results.opendata.cached")}
        </p>
        {openData.facilities.map((facility) => (
          <div
            key={`${facility.name}-${facility.address ?? ""}`}
            className="rounded-xl border-2 border-line-neutral bg-white px-3 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[14px] font-semibold text-text-primary">{facility.name}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                facility.live ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
              }`}>
                {facility.live ? "OpenAPI" : t("results.opendata.official")}
              </span>
            </div>
            {facility.address && (
              <p className="text-[12px] text-text-secondary mt-1">{facility.address}</p>
            )}
            {facility.phone && (
              <p className="text-[12px] text-text-secondary">{facility.phone}</p>
            )}
            <p className="text-[11px] text-text-tertiary mt-1">
              {facility.provider} · {facility.dataset}
            </p>
            {facility.datasetUrl && (
              <a
                href={facility.datasetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-accent-700 underline"
              >
                {t("results.opendata.source")}
              </a>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
