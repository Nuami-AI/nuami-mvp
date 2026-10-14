"use client";

import { useEffect, useState } from "react";
import { SettingsDropdown } from "@/components/ui/settings-dropdown";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { loadPreferences, savePreferences, type ToneStyle, type LifeStage, type StayType } from "@/lib/user/preferences";

type OptionItem<T> = { value: T; labelKey: TranslationKey; descKey: TranslationKey };

export const TONE_OPTIONS: OptionItem<ToneStyle>[] = [
  { value: "default", labelKey: "mypage.tone.default", descKey: "mypage.tone.defaultDesc" },
  { value: "casual", labelKey: "mypage.tone.casual", descKey: "mypage.tone.casualDesc" },
  { value: "concise", labelKey: "mypage.tone.concise", descKey: "mypage.tone.conciseDesc" },
  { value: "expert", labelKey: "mypage.tone.expert", descKey: "mypage.tone.expertDesc" },
];

export const STAGE_OPTIONS: OptionItem<LifeStage>[] = [
  { value: "arrived", labelKey: "mypage.stage.arrived", descKey: "mypage.stage.arrivedDesc" },
  { value: "settling", labelKey: "mypage.stage.settling", descKey: "mypage.stage.settlingDesc" },
  { value: "established", labelKey: "mypage.stage.established", descKey: "mypage.stage.establishedDesc" },
];

export const VISA_OPTIONS: OptionItem<StayType>[] = [
  { value: "D-2", labelKey: "mypage.visa.d2", descKey: "mypage.visa.d2Desc" },
  { value: "D-4", labelKey: "mypage.visa.d4", descKey: "mypage.visa.d4Desc" },
  { value: "other", labelKey: "mypage.visa.other", descKey: "mypage.visa.otherDesc" },
];

export function PreferenceField({ kind }: { kind: "tone" | "stage" | "visa" }) {
  const { t } = useLanguage();
  const [toneStyle, setToneStyle] = useState<ToneStyle>("default");
  const [lifeStage, setLifeStage] = useState<LifeStage>("arrived");
  const [stayType, setStayType] = useState<StayType>("D-2");

  useEffect(() => {
    const prefs = loadPreferences();
    setToneStyle(prefs.toneStyle);
    setLifeStage(prefs.lifeStage);
    setStayType(prefs.stayType);
  }, []);

  const persist = (next: { toneStyle?: ToneStyle; lifeStage?: LifeStage; stayType?: StayType }) => {
    savePreferences({ ...loadPreferences(), ...next });
  };

  if (kind === "tone") {
    return (
      <div>
        <p className="text-[13px] font-semibold text-text-secondary mb-1">{t("mypage.tone.title")}</p>
        <p className="text-[12px] text-text-tertiary mb-4">{t("mypage.tone.desc")}</p>
        <SettingsDropdown
          label={t("mypage.tone.title")}
          value={toneStyle}
          options={TONE_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey), hint: t(opt.descKey) }))}
          onChange={(value) => {
            setToneStyle(value);
            persist({ toneStyle: value });
          }}
        />
      </div>
    );
  }

  if (kind === "stage") {
    return (
      <div>
        <p className="text-[13px] font-semibold text-text-secondary mb-1">{t("mypage.stage.title")}</p>
        <p className="text-[12px] text-text-tertiary mb-4">{t("mypage.stage.desc")}</p>
        <SettingsDropdown
          label={t("mypage.stage.title")}
          value={lifeStage}
          options={STAGE_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey), hint: t(opt.descKey) }))}
          onChange={(value) => {
            setLifeStage(value);
            persist({ lifeStage: value });
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <p className="text-[13px] font-semibold text-text-secondary mb-1">{t("mypage.visa.title")}</p>
      <p className="text-[12px] text-text-tertiary mb-4">{t("mypage.visa.desc")}</p>
      <SettingsDropdown
        label={t("mypage.visa.title")}
        value={stayType}
        options={VISA_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey), hint: t(opt.descKey) }))}
        onChange={(value) => {
          setStayType(value);
          persist({ stayType: value });
        }}
      />
    </div>
  );
}

export default function PreferenceSelector() {
  return (
    <div className="space-y-8">
      <PreferenceField kind="tone" />
      <PreferenceField kind="stage" />
      <PreferenceField kind="visa" />
    </div>
  );
}
