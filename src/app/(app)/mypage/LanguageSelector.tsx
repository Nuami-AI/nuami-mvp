"use client";

import { useState } from "react";
import { SettingsDropdown } from "@/components/ui/settings-dropdown";
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
    <div>
      <p className="text-[13px] font-semibold text-text-secondary mb-1">{t("mypage.lang.title")}</p>
      <p className="text-[12px] text-text-tertiary mb-4">{t("mypage.lang.desc")}</p>
      <SettingsDropdown
        label={t("mypage.lang.title")}
        value={lang}
        options={[
          ...PRESET_OPTIONS.map((row) => ({ value: row.code, label: row.label, hint: row.native })),
          {
            value: "custom" as const,
            label: t("mypage.lang.custom"),
            hint: customLangLabel || undefined,
          },
        ]}
        onChange={(next) => {
          if (next === "custom") {
            setShowCustom(true);
            setLang("custom");
            return;
          }
          setShowCustom(false);
          setLang(next);
        }}
      />
      {showCustom ? (
        <div className="mt-3 rounded-2xl border border-line-neutral bg-white p-4 space-y-3">
          <p className="text-[12px] text-text-secondary">{t("mypage.lang.customHint")}</p>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={t("mypage.lang.customPlaceholder")}
            className="w-full text-[14px] border border-line-neutral rounded-xl px-4 py-3 focus:outline-none focus:border-accent-500"
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
      ) : null}
    </div>
  );
}
