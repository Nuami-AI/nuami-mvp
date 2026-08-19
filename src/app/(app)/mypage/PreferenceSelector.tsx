"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { loadPreferences, savePreferences, type ToneStyle, type LifeStage, type StayType } from "@/lib/user/preferences";

type OptionItem<T> = { value: T; labelKey: string; descKey: string };

const TONE_OPTIONS: OptionItem<ToneStyle>[] = [
  { value: "default",  labelKey: "mypage.tone.default",  descKey: "mypage.tone.defaultDesc" },
  { value: "casual",   labelKey: "mypage.tone.casual",   descKey: "mypage.tone.casualDesc" },
  { value: "concise",  labelKey: "mypage.tone.concise",  descKey: "mypage.tone.conciseDesc" },
  { value: "expert",   labelKey: "mypage.tone.expert",   descKey: "mypage.tone.expertDesc" },
];

const STAGE_OPTIONS: OptionItem<LifeStage>[] = [
  { value: "arrived",     labelKey: "mypage.stage.arrived",     descKey: "mypage.stage.arrivedDesc" },
  { value: "settling",    labelKey: "mypage.stage.settling",    descKey: "mypage.stage.settlingDesc" },
  { value: "established", labelKey: "mypage.stage.established", descKey: "mypage.stage.establishedDesc" },
];

const VISA_OPTIONS: OptionItem<StayType>[] = [
  { value: "D-2", labelKey: "mypage.visa.d2", descKey: "mypage.visa.d2Desc" },
  { value: "D-4", labelKey: "mypage.visa.d4", descKey: "mypage.visa.d4Desc" },
  { value: "other", labelKey: "mypage.visa.other", descKey: "mypage.visa.otherDesc" },
];

function CheckIcon() {
  return (
    <svg className="ml-3 flex-shrink-0" width="18" height="18" fill="none" stroke="#8651F2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function OptionButton<T extends string>({
  option, isActive, onClick,
}: {
  option: OptionItem<T>;
  isActive: boolean;
  onClick: () => void;
}) {
  const { t } = useLanguage();
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border transition-all ${
        isActive
          ? "border-accent-700 bg-accent-50 text-accent-700"
          : "border-line-normal bg-background text-text-primary hover:bg-muted"
      }`}
    >
      <span className="text-[14px] font-semibold">{t(option.labelKey as Parameters<typeof t>[0])}</span>
      <span className="text-[12px] text-text-tertiary flex-1 text-right mr-2">{t(option.descKey as Parameters<typeof t>[0])}</span>
      {isActive && <CheckIcon />}
    </button>
  );
}

export default function PreferenceSelector() {
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
    const current = loadPreferences();
    savePreferences({ ...current, ...next });
  };

  const handleTone = (v: ToneStyle) => {
    setToneStyle(v);
    persist({ toneStyle: v });
  };

  const handleStage = (v: LifeStage) => {
    setLifeStage(v);
    persist({ lifeStage: v });
  };

  const handleVisa = (v: StayType) => {
    setStayType(v);
    persist({ stayType: v });
  };

  return (
    <div className="px-4 md:px-6 mt-8 space-y-8">
      {/* Tone Style */}
      <div>
        <p className="text-[13px] font-semibold text-text-secondary mb-1">{t("mypage.tone.title")}</p>
        <p className="text-[12px] text-text-tertiary mb-4">{t("mypage.tone.desc")}</p>
        <div className="flex flex-col gap-2">
          {TONE_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} option={opt} isActive={toneStyle === opt.value} onClick={() => handleTone(opt.value)} />
          ))}
        </div>
      </div>

      {/* Life Stage */}
      <div>
        <p className="text-[13px] font-semibold text-text-secondary mb-1">{t("mypage.stage.title")}</p>
        <p className="text-[12px] text-text-tertiary mb-4">{t("mypage.stage.desc")}</p>
        <div className="flex flex-col gap-2">
          {STAGE_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} option={opt} isActive={lifeStage === opt.value} onClick={() => handleStage(opt.value)} />
          ))}
        </div>
      </div>
      {/* Stay type */}
      <div>
        <p className="text-[13px] font-semibold text-text-secondary mb-1">{t("mypage.visa.title")}</p>
        <p className="text-[12px] text-text-tertiary mb-4">{t("mypage.visa.desc")}</p>
        <div className="flex flex-col gap-2">
          {VISA_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} option={opt} isActive={stayType === opt.value} onClick={() => handleVisa(opt.value)} />
          ))}
        </div>
      </div>
    </div>
  );
}
