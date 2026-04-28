"use client";

import { useLanguage } from "@/lib/i18n";

export default function ContentDesktopHeader() {
  const { t } = useLanguage();
  return (
    <div className="hidden md:block px-6 pt-8 pb-2">
      <h1 className="text-[26px] font-bold text-text-primary">{t("content.title")}</h1>
      <p className="text-[14px] text-text-secondary mt-1">{t("content.subtitle")}</p>
    </div>
  );
}
