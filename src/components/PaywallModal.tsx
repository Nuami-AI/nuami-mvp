"use client";

// Design Ref: §5.3 PaywallModal — forced choice overlay, no ESC/outside-click dismiss
// Plan SC: FR-08, FR-09
import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n";

interface Props {
  onSubscribe: () => void;
  onDismiss: () => void;
  limit?: number | null;
  daily?: boolean;
}

function LockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export async function readPaywallLimit(res: Response): Promise<number | null> {
  const state = await readPaywallState(res);
  return state.limit;
}

export async function readPaywallState(res: Response): Promise<{ limit: number | null; daily: boolean }> {
  const body = (await res.json().catch(() => null)) as {
    error?: { limit?: unknown; daily?: unknown };
  } | null;
  const limit = Number(body?.error?.limit);
  return {
    limit: Number.isFinite(limit) && limit > 0 ? limit : null,
    daily: body?.error?.daily === true,
  };
}

export default function PaywallModal({ onSubscribe, onDismiss, limit, daily }: Props) {
  const { t } = useLanguage();
  const title = daily ? t("paywall.dailyTitle") : t("paywall.title");
  const desc = daily
    ? limit != null && limit > 0
      ? t("paywall.dailyDesc").replaceAll("{count}", String(limit))
      : t("paywall.dailyDescGeneric")
    : limit != null && limit > 0
      ? t("paywall.desc").replaceAll("{count}", String(limit))
      : t("paywall.descGeneric");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative w-full sm:max-w-sm mx-auto bg-background rounded-t-3xl sm:rounded-3xl px-6 pt-8 pb-10 shadow-xl">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-accent-100 flex items-center justify-center text-accent-700">
            <LockIcon />
          </div>
        </div>

        <h2 className="text-[18px] font-bold text-text-primary text-center leading-snug whitespace-pre-line">
          {title}
        </h2>
        <p className="mt-2.5 text-[13px] text-text-secondary text-center leading-relaxed whitespace-pre-line">
          {desc}
        </p>

        <div className="mt-7 space-y-3">
          <button
            onClick={onSubscribe}
            className="w-full rounded-2xl bg-accent-700 text-white py-4 text-[15px] font-bold hover:bg-accent-800 active:scale-[0.98] transition-all"
          >
            {t("paywall.subscribe")}
          </button>
          <button
            onClick={onDismiss}
            className="w-full rounded-2xl bg-infoBox text-text-secondary py-4 text-[15px] font-medium hover:bg-muted active:scale-[0.98] transition-all"
          >
            {t("paywall.dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
