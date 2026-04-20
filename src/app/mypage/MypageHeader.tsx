"use client";

import { useLanguage } from "@/lib/i18n";

export default function MypageHeader() {
  const { t } = useLanguage();
  return (
    <div className="px-4 pt-14 pb-2 md:hidden">
      <h1 className="text-[18px] font-bold text-text-primary">{t("mypage.title")}</h1>
    </div>
  );
}
