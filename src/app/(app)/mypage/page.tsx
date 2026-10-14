"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { ProfileCard } from "@/components/mypage/ProfileCard";
import { SettingsGroup, SettingsRow } from "@/components/mypage/SettingsRow";
import { PageHeader } from "@/components/ui/page-header";
import { useCampusAffiliation } from "@/hooks/useCampusAffiliation";
import { useLocationPreference } from "@/hooks/useLocationPreference";
import { LANGUAGE_LABELS, useLanguage } from "@/lib/i18n";
import { loadPreferences } from "@/lib/user/preferences";
import { clearActiveUserEmail } from "@/lib/user/storage-scope";
import { STAGE_OPTIONS, TONE_OPTIONS, VISA_OPTIONS } from "./PreferenceSelector";

function interp(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export default function MypagePage() {
  const { t, lang, customLangLabel } = useLanguage();
  const router = useRouter();
  const { universityName } = useCampusAffiliation();
  const { enabled: locationEnabled } = useLocationPreference();
  const [tone, setTone] = useState("");
  const [stage, setStage] = useState("");
  const [visa, setVisa] = useState("");
  const [usageLabel, setUsageLabel] = useState("");

  useEffect(() => {
    const sync = () => {
      const prefs = loadPreferences();
      setTone(t(TONE_OPTIONS.find((row) => row.value === prefs.toneStyle)?.labelKey ?? "mypage.tone.default"));
      setStage(t(STAGE_OPTIONS.find((row) => row.value === prefs.lifeStage)?.labelKey ?? "mypage.stage.arrived"));
      setVisa(t(VISA_OPTIONS.find((row) => row.value === prefs.stayType)?.labelKey ?? "mypage.visa.d2"));
    };
    sync();
    window.addEventListener("nuami-prefs", sync);
    return () => window.removeEventListener("nuami-prefs", sync);
  }, [t]);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { remaining?: number | null; role?: string } | null) => {
        if (!d || d.remaining == null) {
          setUsageLabel(t("mypage.usage.unlimited"));
          return;
        }
        setUsageLabel(interp(t("mypage.usage.remaining"), { count: String(d.remaining) }));
      })
      .catch(() => {});
  }, [t]);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "audience=app",
      redirect: "manual",
    }).catch(() => {});
    clearActiveUserEmail();
    router.push("/login");
  }

  const languageValue = lang === "custom" ? customLangLabel || t("mypage.lang.custom") : LANGUAGE_LABELS[lang];

  return (
    <PageShell topNav="mypage" bottomNav="mypage">
      <PageHeader variant="top" title={t("mypage.title")} trailing={<span />} />

      <ProfileCard />

      <div className="h-2 bg-[#F4F4F1]" />
      <SettingsGroup>
        <SettingsRow href="/mypage/university" label={t("affiliation.settingsTitle")} value={universityName || t("affiliation.empty")} />
        <SettingsRow href="/mypage/visa" label={t("mypage.visa.title")} value={visa} />
        <SettingsRow href="/mypage/stage" label={t("mypage.stage.title")} value={stage} />
        <SettingsRow href="/mypage/arc" label={t("mypage.arc.title")} />
      </SettingsGroup>

      <div className="h-2 bg-[#F4F4F1]" />
      <SettingsGroup>
        <SettingsRow href="/mypage/language" label={t("mypage.lang.title")} value={languageValue} />
        <SettingsRow href="/mypage/persona" label={t("mypage.tone.title")} value={tone} />
        <SettingsRow
          href="/mypage/location"
          label={t("mypage.location.title")}
          value={locationEnabled ? t("mypage.location.on") : t("mypage.location.off")}
        />
        <SettingsRow href="/mypage/password" label={t("mypage.password.title")} />
      </SettingsGroup>

      <div className="h-2 bg-[#F4F4F1]" />
      <SettingsGroup>
        <SettingsRow href="/history" label={t("mypage.history.title")} />
        <SettingsRow href="/saved" label={t("mypage.saved")} />
        <SettingsRow href="/mypage/usage" label={t("mypage.usage.title")} value={usageLabel} />
      </SettingsGroup>

      <div className="h-2 bg-[#F4F4F1]" />
      <SettingsGroup>
        <SettingsRow href="/mypage/help" label={t("mypage.help.title")} />
        <SettingsRow label={t("mypage.logout")} onClick={() => void handleLogout()} danger />
      </SettingsGroup>

      <div className="h-8" />
    </PageShell>
  );
}
