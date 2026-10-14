"use client";

import { useEffect, useState } from "react";
import { useCampusAffiliation } from "@/hooks/useCampusAffiliation";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { getInstitution, institutionLogoSrc } from "@/lib/institution/catalog";
import { loadPreferences, type StayType } from "@/lib/user/preferences";

const DEFAULT_AVATAR = "/icons/profile/default.svg";

const VISA_LABEL: Record<StayType, TranslationKey> = {
  "D-2": "mypage.visa.d2",
  "D-4": "mypage.visa.d4",
  other: "mypage.visa.other",
};

function ProfileAvatar({ universityId }: { universityId: string | null }) {
  const institution = universityId ? getInstitution(universityId) : undefined;
  const logoSrc = institution
    ? institutionLogoSrc(institution.city, institution.logoFile || institution.id)
    : null;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [logoSrc]);

  const showLogo = Boolean(logoSrc) && !failed;

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8E8E4]">
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc!}
          alt=""
          className="h-full w-full object-contain bg-white p-2"
          onError={() => setFailed(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={DEFAULT_AVATAR} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

export function ProfileCard() {
  const { t } = useLanguage();
  const { universityId, universityName } = useCampusAffiliation();
  const [me, setMe] = useState<{ email: string; displayName: string } | null>(null);
  const [stayType, setStayType] = useState<StayType>("D-2");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { email?: string; displayName?: string } | null) => {
        if (d?.email) setMe({ email: d.email, displayName: d.displayName || d.email.split("@")[0] });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const sync = () => setStayType(loadPreferences().stayType);
    sync();
    window.addEventListener("nuami-prefs", sync);
    return () => window.removeEventListener("nuami-prefs", sync);
  }, []);

  return (
    <div className="flex items-center gap-4 px-4 py-6 md:px-6">
      <ProfileAvatar universityId={universityId} />
      <div className="min-w-0 flex-1">
        {universityName ? (
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-semibold text-accent-700">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="7" fill="currentColor" className="text-accent-700" />
              <path d="M5 8.2 7 10.2 11 5.8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {universityName}
          </span>
        ) : (
          <span className="mb-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-text-tertiary">
            {t("affiliation.empty")}
          </span>
        )}
        <p className="truncate text-[18px] font-bold leading-snug text-text-primary">{me?.displayName ?? "…"}</p>
        <p className="truncate text-[13px] text-text-tertiary">{me?.email ?? ""}</p>
        <p className="mt-1 text-[12px] text-text-secondary">{t(VISA_LABEL[stayType])}</p>
      </div>
    </div>
  );
}
