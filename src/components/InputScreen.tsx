"use client";

// Design Ref: §6.1 platform-pivot — situation-first input with QuickChips + optional URL toggle.
// Plan SC: FR-01 — QuickChips, SituationTextarea, UrlToggle, "Generate Action Guide" CTA.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageShell from "./PageShell";
import { Button } from "./ui/button";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { PageHeader } from "./ui/page-header";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import type { ExtractError } from "@/types/extraction";
import type { UsageInfo } from "@/app/page";

interface Props {
  situation: string;
  url: string;
  onSituationChange: (v: string) => void;
  onUrlChange: (v: string) => void;
  onExtract: () => void;
  isLoading?: boolean;
  error?: ExtractError | null;
  onDismissError?: () => void;
  usageInfo?: UsageInfo;
}

// ── Icons ────────────────────────────────────────────────────────────────────

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
      className={cn("transition-transform duration-200", open && "rotate-180")}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg width="18" height="18" fill="#E2E2DE" stroke="#8A8981" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="#de3412" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function DismissIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="#8a240f" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function Illustration({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="148" height="148" viewBox="0 0 148 148" fill="none">
      <circle cx="74" cy="74" r="50" fill="#F2EBFF" />
      {/* Person figure */}
      <circle cx="74" cy="52" r="12" fill="#8651F2" />
      <path d="M52 95c0-12.15 9.85-22 22-22s22 9.85 22 22" stroke="#8651F2" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Checklist card */}
      <rect x="84" y="62" width="44" height="52" rx="8" fill="#8651F2" />
      <line x1="92" y1="74" x2="120" y2="74" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="92" y1="82" x2="116" y2="82" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="92" y1="90" x2="118" y2="90" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="89" cy="74" r="2" fill="white" />
      <circle cx="89" cy="82" r="2" fill="white" />
      <circle cx="89" cy="90" r="2" fill="white" />
      {/* Star badge */}
      <circle cx="30" cy="80" r="14" fill="#B186FF" />
      <path d="M30 72l2.06 4.18 4.61.67-3.34 3.25.79 4.59L30 82.5l-4.12 2.19.79-4.59L23.33 76.85l4.61-.67L30 72z" fill="white" />
    </svg>
  );
}

// ── Quick Chips ───────────────────────────────────────────────────────────────

type ChipKey = "input.chip.bank" | "input.chip.professor" | "input.chip.hospital" | "input.chip.transit" | "input.chip.dorm" | "input.chip.food" | "input.chip.shopping";

const CHIPS: { labelKey: ChipKey; icon: string }[] = [
  { labelKey: "input.chip.bank",      icon: "🏦" },
  { labelKey: "input.chip.professor", icon: "📧" },
  { labelKey: "input.chip.hospital",  icon: "🏥" },
  { labelKey: "input.chip.transit",   icon: "🚇" },
  { labelKey: "input.chip.dorm",      icon: "🏠" },
  { labelKey: "input.chip.food",      icon: "🍜" },
  { labelKey: "input.chip.shopping",  icon: "🛍️" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function InputScreen({
  situation,
  url,
  onSituationChange,
  onUrlChange,
  onExtract,
  isLoading = false,
  error = null,
  onDismissError,
  usageInfo,
}: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const [showUrl, setShowUrl] = useState(false);

  useEffect(() => {
    if (url.trim()) setShowUrl(true);
  }, [url]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  }

  const canGenerate = situation.trim().length > 0 && !isLoading;

  const remainingBadge =
    usageInfo?.role === "tester" && usageInfo.remaining !== null ? (
      <span className="ml-2 inline-flex items-center rounded-full bg-infoBox px-2 py-0.5 text-[11px] font-medium text-accent-700">
        {usageInfo.remaining}회 남음
      </span>
    ) : null;

  function friendlyError(err: ExtractError): { title: string; hint?: string } {
    switch (err.code) {
      case "INVALID_SITUATION":
        return { title: t("error.invalidSituation") };
      case "INVALID_URL":
        return { title: t("error.invalidUrl"), hint: err.hint };
      case "UNSUPPORTED_PLATFORM":
        return { title: t("error.unsupportedPlatform"), hint: err.hint ?? t("error.tryYouTube") };
      case "TRANSCRIPT_UNAVAILABLE":
        return { title: t("error.transcriptUnavailable"), hint: err.hint };
      case "TRANSCRIPT_TOO_SHORT":
        return { title: t("error.transcriptTooShort"), hint: err.hint };
      case "CLAUDE_PARSE_FAILED":
        return { title: t("error.claudeParseFailed"), hint: t("error.tryAgain") };
      case "RATE_LIMITED":
        return { title: t("error.rateLimited"), hint: err.hint };
      case "INTERNAL":
      default:
        return { title: t("error.internal"), hint: t("error.tryAgain") };
    }
  }

  const shownError = error ? friendlyError(error) : null;

  const ctaButton = (
    <Button
      onClick={onExtract}
      disabled={!canGenerate}
      className={cn(
        "w-full h-auto py-[15px] rounded-2xl text-[15px] font-bold active:scale-[0.98]",
        isLoading && "pointer-events-none opacity-80 cursor-wait"
      )}
    >
      {isLoading ? (
        <>
          <Spinner />
          {t("input.cta.extracting")}
        </>
      ) : (
        <>
          <span className="text-base">✦</span>
          {t("input.cta.extract")}
        </>
      )}
    </Button>
  );

  return (
    <PageShell
      topNav="guide"
      bottomNav="home"
      className="pb-44 md:pb-16 lg:pb-20"
    >
      <PageHeader
        title={`👋 ${t("input.welcome")}`}
        trailing={
          <div className="flex items-center gap-2">
            {remainingBadge}
            <button
              onClick={handleLogout}
              className="text-[12px] text-text-tertiary hover:text-text-secondary transition-colors px-1 md:hidden"
              aria-label="로그아웃"
            >
              로그아웃
            </button>
          </div>
        }
      />

      <div className="px-4 md:px-6 lg:grid lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:items-start lg:py-12">

        {/* ── Hero ── */}
        <div className="flex flex-col items-center lg:items-start lg:pt-4">
          <div className="flex justify-center mt-6 lg:mt-0">
            <Illustration className="lg:w-44 lg:h-44" />
          </div>
          <h1 className="text-[21px] lg:text-3xl font-bold text-center lg:text-left text-text-primary mt-5 leading-tight">
            {t("input.hero.title")}
          </h1>
          <p className="text-[13px] lg:text-sm text-text-tertiary text-center lg:text-left mt-2 leading-relaxed">
            {t("input.hero.desc")}
          </p>
        </div>

        {/* ── Input Panel ── */}
        <div className="mt-8 lg:mt-0 md:max-w-xl md:mx-auto lg:max-w-none lg:mx-0 space-y-4">

          {/* Quick Chips */}
          <div className="flex flex-wrap gap-2">
            {CHIPS.map(({ labelKey, icon }) => {
              const label = t(labelKey);
              const isActive = situation === label;
              return (
                <button
                  key={labelKey}
                  disabled={isLoading}
                  onClick={() => onSituationChange(isActive ? "" : label)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium border transition-colors",
                    isActive
                      ? "bg-accent-700 text-white border-accent-700"
                      : "bg-background text-text-secondary border-line-normal hover:border-accent-300 hover:text-accent-700",
                    isLoading && "opacity-50 pointer-events-none"
                  )}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Situation Textarea */}
          <div>
            <p className="text-[13px] font-semibold text-text-secondary mb-2">{t("input.situation.label")}</p>
            <div className="bg-background border border-line-normal rounded-2xl px-4 py-3.5 shadow-sm focus-within:ring-2 focus-within:ring-accent-700 focus-within:ring-offset-1 transition-shadow">
              <textarea
                rows={3}
                value={situation}
                onChange={(e) => onSituationChange(e.target.value)}
                placeholder={t("input.situation.placeholder")}
                disabled={isLoading}
                className="w-full text-[13px] text-text-primary outline-none placeholder:text-text-disabled bg-transparent resize-none disabled:opacity-60 leading-relaxed"
              />
            </div>
          </div>

          {/* URL Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowUrl((v) => !v)}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <ChevronDown open={showUrl} />
              {t("input.url.toggle")}
            </button>

            {showUrl && (
              <div className="mt-2 flex items-center bg-background border border-line-normal rounded-2xl px-4 py-[14px] shadow-sm focus-within:ring-2 focus-within:ring-accent-700 focus-within:ring-offset-1 transition-shadow">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => onUrlChange(e.target.value)}
                  placeholder={t("input.url.placeholder")}
                  disabled={isLoading}
                  className="flex-1 text-[13px] text-text-primary outline-none placeholder:text-text-disabled bg-transparent min-w-0 disabled:opacity-60"
                />
                {url && !isLoading && (
                  <button onClick={() => onUrlChange("")} className="ml-2 shrink-0" aria-label="Clear URL">
                    <XCircleIcon />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {shownError && (
            <Alert className="py-2.5 px-3 border-danger-200 bg-danger-50 text-danger-800">
              <AlertCircleIcon />
              <AlertTitle className="text-[13px] font-semibold text-danger-800 leading-snug">
                {shownError.title}
              </AlertTitle>
              {shownError.hint && (
                <AlertDescription className="text-[12px] text-danger-700 mt-0.5 leading-relaxed">
                  {shownError.hint}
                </AlertDescription>
              )}
              {onDismissError && (
                <button onClick={onDismissError} className="absolute right-2 top-2 p-1" aria-label="Dismiss error">
                  <DismissIcon />
                </button>
              )}
            </Alert>
          )}

          {/* Desktop CTA */}
          <div className="hidden md:block">
            {ctaButton}
          </div>
        </div>
      </div>

      {/* Mobile fixed CTA */}
      <div className="fixed bottom-[56px] left-0 w-full px-4 py-3 bg-background md:hidden">
        {ctaButton}
      </div>
    </PageShell>
  );
}
