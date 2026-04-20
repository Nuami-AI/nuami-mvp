"use client";

import { useLanguage } from "@/lib/i18n";

export default function ContentPageHeader() {
  const { t } = useLanguage();
  return (
    <div className="pt-14 pb-3 px-4 md:pt-6 md:px-6">
      <h1 className="text-[18px] md:text-[22px] font-bold text-text-primary">{t("content.title")}</h1>
      <p className="text-[13px] text-text-secondary mt-0.5">{t("content.subtitle")}</p>
    </div>
  );
}
