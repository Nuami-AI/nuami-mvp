"use client";

// Design Ref: §6.1 platform-pivot — situation-first input with QuickChips + optional URL toggle.
// Plan SC: FR-01 — QuickChips, SituationTextarea, UrlToggle, "Generate Action Guide" CTA.

import Image from "next/image";
import { useState, useEffect } from "react";
import PageShell from "./PageShell";
import ExampleCategoryPicker from "./ExampleCategoryPicker";
import PipelineLoading from "./guide/PipelineLoading";
import { Button } from "./ui/button";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { HeaderIconButton } from "./ui/header-icon";
import { PageHeader, RemainingBadge } from "./ui/page-header";
import { interpolate } from "./results-shared";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import type { ExtractError } from "@/types/extraction";
import type { UsageInfo } from "@/types/usage";

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
    <Image
      src="/brand/nami-bot.png"
      alt="nami bot"
      width={400}
      height={400}
      priority
      className={cn("w-[148px] h-[148px] object-contain", className)}
    />
  );
}

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
  const [showUrl, setShowUrl] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<"search" | "reason" | "generate">("search");
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (url.trim()) setShowUrl(true);
  }, [url]);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { displayName?: string } | null) => {
        if (d?.displayName) setDisplayName(d.displayName);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setPipelineStep("search");
      return;
    }
    setPipelineStep("search");
    const t1 = window.setTimeout(() => setPipelineStep("reason"), 700);
    const t2 = window.setTimeout(() => setPipelineStep("generate"), 1600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isLoading]);

  const canGenerate = situation.trim().length > 0 && !isLoading;
  const welcome = displayName
    ? interpolate(t("input.welcome"), { name: displayName })
    : t("input.welcomeAnon");

  const remainingBadge =
    usageInfo?.role === "tester" && usageInfo.remaining !== null ? (
      <RemainingBadge count={usageInfo.remaining} />
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
      topNav="home"
      bottomNav="home"
      className="pb-44 md:pb-16 lg:pb-20"
    >
      <PageHeader
        variant="home"
        title={welcome}
        trailing={
          <>
            {remainingBadge}
            <HeaderIconButton name="notifications" label={t("header.notifications")} />
          </>
        }
      />

      <div className="px-4 md:px-6 lg:grid lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:items-start lg:py-12">

        {/* ── Hero ── */}
        <div className="flex flex-col items-center lg:items-start lg:pt-4">
          <div className="flex justify-center mt-6 lg:mt-0">
            <Illustration className="lg:w-56 lg:h-56" />
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

          <ExampleCategoryPicker
            situation={situation}
            onSituationChange={onSituationChange}
            disabled={isLoading}
          />

          {/* Prominent search bar — Trip.com style, 16px prevents iOS zoom */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-700 pointer-events-none">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
            </div>
            <div className="bg-white border-2 border-accent-200 rounded-2xl pl-12 pr-4 py-4 shadow-md focus-within:border-accent-700 focus-within:shadow-lg transition-all">
              <textarea
                rows={2}
                value={situation}
                onChange={(e) => onSituationChange(e.target.value)}
                placeholder={t("input.situation.placeholder")}
                disabled={isLoading}
                className="w-full text-base text-text-primary outline-none placeholder:text-text-disabled bg-transparent resize-none disabled:opacity-60 leading-relaxed"
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
                  className="flex-1 text-base text-text-primary outline-none placeholder:text-text-disabled bg-transparent min-w-0 disabled:opacity-60"
                />
                {url && !isLoading && (
                  <button onClick={() => onUrlChange("")} className="ml-2 shrink-0" aria-label="Clear URL">
                    <XCircleIcon />
                  </button>
                )}
              </div>
            )}
          </div>

          {isLoading && <PipelineLoading active={pipelineStep} t={t} />}

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

      {/* Mobile fixed CTA — wrapper must not steal taps from content behind it */}
      <div className="pointer-events-none fixed bottom-[56px] left-0 z-10 w-full px-4 py-3 md:hidden">
        <div className="pointer-events-auto">{ctaButton}</div>
      </div>
    </PageShell>
  );
}
