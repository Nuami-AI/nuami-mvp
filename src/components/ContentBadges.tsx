"use client";

// Design Ref: §2 — content/[id] 카테고리·국가 뱃지. i18n 적용.

import { useLanguage } from "@/lib/i18n";

interface Props {
  category: string;
  country: string;
}

export default function ContentBadges({ category, country }: Props) {
  const { t } = useLanguage();

  const catKey = `content.cat.${category}` as Parameters<typeof t>[0];
  const countryKey = `content.country.${country.toLowerCase()}` as Parameters<typeof t>[0];

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium bg-accent-100 text-accent-700 rounded-full px-2 py-0.5">
        {t(catKey) ?? category}
      </span>
      <span className="text-[11px] font-medium bg-infoBox text-text-secondary rounded-full px-2 py-0.5">
        {t(countryKey) ?? country}
      </span>
    </div>
  );
}
