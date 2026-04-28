"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

import type { TranslationKey } from "@/lib/i18n/ko";

const COUNTRIES = ["KR", "JP"] as const;
const COUNTRY_LABELS: Record<string, TranslationKey> = {
  KR: "content.country.kr",
  JP: "content.country.jp",
};

export default function CountryTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("country") ?? "KR";
  const { t } = useLanguage();

  function handleChange() {
    const idx = COUNTRIES.indexOf(current as typeof COUNTRIES[number]);
    const next = COUNTRIES[(idx + 1) % COUNTRIES.length];
    const params = new URLSearchParams(searchParams.toString());
    params.set("country", next);
    params.delete("page");
    router.push(`/content?${params.toString()}`);
  }

  const countryName = t(COUNTRY_LABELS[current] as TranslationKey) ?? current;

  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <p className="text-[14px] font-semibold text-accent-700">
        {countryName}에 방문했나요?
      </p>
      <button
        onClick={handleChange}
        className="flex items-center gap-0.5 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors"
      >
        지금 장소 변경
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  );
}
