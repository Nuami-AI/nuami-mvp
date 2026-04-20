"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/ko";

const COUNTRIES: { code: string; labelKey: TranslationKey }[] = [
  { code: "KR", labelKey: "content.country.kr" },
  { code: "JP", labelKey: "content.country.jp" },
];

export default function CountryTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("country") ?? "KR";
  const { t } = useLanguage();

  function handleSelect(code: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("country", code);
    next.delete("page");
    router.push(`/content?${next.toString()}`);
  }

  return (
    <div className="flex gap-2 px-4">
      {COUNTRIES.map(({ code, labelKey }) => {
        const isActive = current === code;
        return (
          <button
            key={code}
            onClick={() => handleSelect(code)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
              isActive
                ? "bg-accent-700 text-text-foreground"
                : "bg-infoBox text-text-secondary hover:bg-gray-200"
            }`}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
