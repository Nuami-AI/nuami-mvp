"use client";

import { useLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

const OPTIONS: { code: Language; label: string; native: string }[] = [
  { code: "ko", label: "한국어", native: "Korean" },
  { code: "en", label: "English", native: "English" },
  { code: "ja", label: "日本語", native: "Japanese" },
];

export default function LanguageSelector() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="px-4 md:px-6 mt-6">
      <p className="text-[13px] font-semibold text-text-secondary mb-1">{t("mypage.lang.title")}</p>
      <p className="text-[12px] text-text-tertiary mb-4">{t("mypage.lang.desc")}</p>
      <div className="flex flex-col gap-2">
        {OPTIONS.map(({ code, label, native }) => {
          const isActive = lang === code;
          return (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border transition-all ${
                isActive
                  ? "border-accent-700 bg-accent-50 text-accent-700"
                  : "border-line-normal bg-background text-text-primary hover:bg-muted"
              }`}
            >
              <span className="text-[14px] font-semibold">{label}</span>
              <span className="text-[12px] text-text-tertiary">{native}</span>
              {isActive && (
                <svg className="ml-3 flex-shrink-0" width="18" height="18" fill="none" stroke="#8651F2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
