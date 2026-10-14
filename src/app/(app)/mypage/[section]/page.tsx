"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import LanguageSelector from "../LanguageSelector";
import { PreferenceField } from "../PreferenceSelector";
import UniversityAffiliation from "@/components/affiliation/UniversityAffiliation";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { LocationSettings } from "@/components/mypage/LocationSettings";
import { MypageSectionShell } from "@/components/mypage/MypageSectionShell";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { useEffect, useState } from "react";

function interp(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

const TITLES: Record<string, TranslationKey> = {
  language: "mypage.lang.title",
  university: "affiliation.settingsTitle",
  visa: "mypage.visa.title",
  stage: "mypage.stage.title",
  persona: "mypage.tone.title",
  location: "mypage.location.title",
  password: "mypage.password.title",
  help: "mypage.help.title",
  usage: "mypage.usage.title",
  arc: "mypage.arc.title",
};

function HelpBody() {
  const { t } = useLanguage();
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-text-tertiary">{t("mypage.help.intro")}</p>
      {[1, 2, 3].map((n) => (
        <div key={n} className="rounded-xl border border-line-normal bg-white px-4 py-3.5">
          <p className="text-[14px] font-semibold text-text-primary">{t(`mypage.help.q${n}` as TranslationKey)}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">{t(`mypage.help.a${n}` as TranslationKey)}</p>
        </div>
      ))}
    </div>
  );
}

function UsageBody() {
  const { t } = useLanguage();
  const [info, setInfo] = useState<{ used: number | null; limit: number | null; remaining: number | null } | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setInfo(d))
      .catch(() => {});
  }, []);

  if (!info) return <p className="text-[13px] text-text-tertiary">{t("common.loading")}</p>;

  const unlimited = info.remaining == null;
  return (
    <div>
      <p className="text-[13px] text-text-tertiary mb-4">{t("mypage.usage.desc")}</p>
      <div className="rounded-xl border border-line-normal bg-white px-4 py-4">
        <p className="text-[20px] font-bold text-text-primary">
          {unlimited
            ? t("mypage.usage.unlimited")
            : interp(t("mypage.usage.remaining"), { count: String(info.remaining) })}
        </p>
        {!unlimited ? (
          <p className="mt-1 text-[13px] text-text-tertiary">
            {interp(t("mypage.usage.used"), { used: String(info.used ?? 0), limit: String(info.limit ?? 0) })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ArcBody() {
  const { t } = useLanguage();
  return (
    <div>
      <p className="text-[13px] text-text-tertiary mb-4">{t("mypage.arc.desc")}</p>
      <p className="text-[14px] leading-relaxed text-text-secondary">{t("mypage.arc.body")}</p>
      <Link
        href="/"
        className="mt-6 flex h-12 items-center justify-center rounded-xl bg-accent-700 text-[14px] font-semibold text-white"
      >
        {t("mypage.arc.cta")}
      </Link>
    </div>
  );
}

export default function MypageSectionPage() {
  const params = useParams<{ section: string }>();
  const { t } = useLanguage();
  const section = params.section;
  const titleKey = TITLES[section];
  if (!titleKey) {
    notFound();
  }

  let body: React.ReactNode = null;
  if (section === "language") body = <LanguageSelector />;
  else if (section === "university") body = <UniversityAffiliation mode="page" />;
  else if (section === "visa") body = <PreferenceField kind="visa" />;
  else if (section === "stage") body = <PreferenceField kind="stage" />;
  else if (section === "persona") body = <PreferenceField kind="tone" />;
  else if (section === "location") body = <LocationSettings />;
  else if (section === "password") {
    body = (
      <ChangePasswordForm
        next="/mypage"
        title=""
        description={t("mypage.password.desc")}
        currentLabel={t("mypage.password.current")}
        nextLabel={t("mypage.password.next")}
        confirmLabel={t("mypage.password.confirm")}
        saveLabel={t("mypage.password.save")}
        mismatchLabel={t("mypage.password.mismatch")}
      />
    );
  } else if (section === "help") body = <HelpBody />;
  else if (section === "usage") body = <UsageBody />;
  else if (section === "arc") body = <ArcBody />;

  return <MypageSectionShell title={t(titleKey)}>{body}</MypageSectionShell>;
}
