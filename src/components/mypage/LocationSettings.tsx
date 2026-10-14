"use client";

import { useUserLocation } from "@/hooks/useUserLocation";
import { useLocationPreference } from "@/hooks/useLocationPreference";
import { useLanguage } from "@/lib/i18n";

export function LocationSettings() {
  const { t } = useLanguage();
  const { enabled, setLocationEnabled } = useLocationPreference();
  const { status, request } = useUserLocation({ enabled: false });

  const statusLabel =
    !enabled
      ? t("mypage.location.off")
      : status === "denied"
        ? t("mypage.location.denied")
        : status === "unavailable"
          ? t("mypage.location.unavailable")
          : t("mypage.location.on");

  return (
    <div>
      <p className="text-[12px] text-text-tertiary mb-5">{t("mypage.location.desc")}</p>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-line-normal bg-white px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-text-primary">{t("mypage.location.title")}</p>
          <p className="mt-0.5 text-[12px] text-text-tertiary">{statusLabel}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => {
            const next = !enabled;
            setLocationEnabled(next);
            if (next) request();
          }}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-accent-700" : "bg-[#D3D3CD]"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-text-tertiary">{t("mypage.location.hint")}</p>
    </div>
  );
}
