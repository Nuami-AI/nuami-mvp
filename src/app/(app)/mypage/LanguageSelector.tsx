"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

const PRESET_OPTIONS: { code: Exclude<Language, "custom">; label: string; native: string }[] = [
  { code: "ko", label: "한국어", native: "Korean" },
  { code: "en", label: "English", native: "English" },
  { code: "ja", label: "日本語", native: "Japanese" },
  { code: "vi", label: "Tiếng Việt", native: "Vietnamese" },
  { code: "zh", label: "中文", native: "Chinese" },
];

export default function LanguageSelector() {
  const { lang, customLangLabel, setLang, setCustomLangLabel, t } = useLanguage();
  const [showCustom, setShowCustom] = useState(lang === "custom");
  const [customInput, setCustomInput] = useState(customLangLabel);

  function saveCustom() {
    if (!customInput.trim()) return;
    setCustomLangLabel(customInput.trim());
    setShowCustom(true);
  }

  return (
    <div className="px-4 md:px-6 mt-6">
      <p className="text-[13px] font-semibold text-text-secondary mb-1">{t("mypage.lang.title")}</p>
      <p className="text-[12px] text-text-tertiary mb-4">{t("mypage.lang.desc")}</p>
      <div className="flex flex-col gap-2">
        {PRESET_OPTIONS.map(({ code, label, native }) => {
          const isActive = lang === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => {
                setShowCustom(false);
                setLang(code);
              }}
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

        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border transition-all ${
            lang === "custom"
              ? "border-accent-700 bg-accent-50 text-accent-700"
              : "border-line-normal bg-background text-text-primary hover:bg-muted"
          }`}
        >
          <span className="text-[14px] font-semibold">{t("mypage.lang.custom")}</span>
          {lang === "custom" && customLangLabel && (
            <span className="text-[12px] text-accent-700 truncate max-w-[120px]">{customLangLabel}</span>
          )}
        </button>

        {showCustom && (
          <div className="rounded-2xl border-2 border-line-neutral bg-white p-4 space-y-3">
            <p className="text-[12px] text-text-secondary">{t("mypage.lang.customHint")}</p>
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={t("mypage.lang.customPlaceholder")}
              className="w-full text-[14px] border-2 border-line-neutral rounded-xl px-4 py-3 focus:outline-none focus:border-accent-500"
            />
            <button
              type="button"
              onClick={saveCustom}
              disabled={!customInput.trim()}
              className="w-full rounded-xl bg-accent-700 text-white text-[13px] font-semibold py-2.5 disabled:opacity-50"
            >
              {t("mypage.lang.customSave")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
