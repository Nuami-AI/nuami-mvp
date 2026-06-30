"use client";

import { useMemo } from "react";
import { useUserLocation } from "@/hooks/useUserLocation";
import { googleRegionLabel } from "@/lib/geo/destination-country";
import { useLanguage } from "@/lib/i18n";

interface Props {
  query: string;
  country: string;
  className?: string;
}

export default function GoogleMapEmbed({ query, country, className = "" }: Props) {
  const { t, lang } = useLanguage();
  const { coords, status, request: requestLocation } = useUserLocation();

  const region = googleRegionLabel(country, lang);
  const searchQ = useMemo(() => {
    const base = query.trim();
    if (!base) return region;
    if (region && !base.includes(region)) return `${base} ${region}`;
    return base;
  }, [query, region]);

  const embedSrc = useMemo(() => {
    const params = new URLSearchParams();
    params.set("q", searchQ);
    params.set("z", "15");
    params.set("output", "embed");
    if (coords) {
      params.set("ll", `${coords.lat},${coords.lng}`);
    }
    return `https://maps.google.com/maps?${params.toString()}`;
  }, [searchQ, coords]);

  const openUrl = useMemo(() => {
    const params = new URLSearchParams({ api: "1", query: searchQ });
    if (coords) {
      params.set("query", searchQ);
      params.set("center", `${coords.lat},${coords.lng}`);
    }
    return `https://www.google.com/maps/search/?${params.toString()}`;
  }, [searchQ, coords]);

  if (!query.trim()) {
    return (
      <div className={`rounded-xl border border-line-neutral bg-infoBox p-5 text-center text-[13px] text-text-secondary ${className}`}>
        {t("results.places.empty")}
      </div>
    );
  }

  return (
    <div className={className}>
      {status === "prompting" && (
        <div className="mb-3 rounded-xl border border-line-neutral bg-infoBox px-4 py-3 text-[13px] text-text-secondary">
          {t("results.location.loading")}
        </div>
      )}
      {(status === "idle" || status === "denied") && !coords && (
        <div className="mb-3 rounded-xl border border-accent-100 bg-accent-50 px-4 py-3">
          <p className="text-[13px] text-text-secondary leading-relaxed">{t("results.location.prompt")}</p>
          <button
            type="button"
            onClick={requestLocation}
            className="mt-2 rounded-lg bg-accent-700 px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            {t("results.location.requestBtn")}
          </button>
        </div>
      )}
      {coords && (
        <p className="mb-2 text-[12px] font-semibold text-accent-700">{t("results.location.nearbySort")}</p>
      )}

      <div className="relative w-full h-[280px] rounded-xl overflow-hidden border border-line-neutral shadow-sm bg-infoBox">
        <iframe
          title={t("results.mapGoogle")}
          src={embedSrc}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      <p className="mt-2 text-[11px] text-text-tertiary">{t("results.mapGoogleHint")}</p>

      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center rounded-xl border border-line-neutral bg-white py-2.5 text-[13px] font-semibold text-text-primary hover:bg-infoBox transition-colors"
      >
        {t("results.mapGoogleOpen")}
      </a>
    </div>
  );
}
