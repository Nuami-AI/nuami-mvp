"use client";

// Design Ref: §5.3 Breakpoints + §5.4 UI Checklist v2 + §5.6 NUAMI tokens.
// Mobile: single-col, fixed CTA above BottomNav.
// md+: TopNav, inline CTA, wider container.
// lg+: 2-col Hero (left) + Input (right) layout.

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
  url: string;
  onChange: (v: string) => void;
  onExtract: () => void;
  isLoading?: boolean;
  error?: ExtractError | null;
  onDismissError?: () => void;
  usageInfo?: UsageInfo;
}

// ── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
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
      <circle cx="64" cy="74" r="50" fill="#F2EBFF" />
      <circle cx="64" cy="74" r="50" stroke="#8651F2" strokeWidth="2.5" fill="none" />
      <ellipse cx="64" cy="74" rx="22" ry="50" stroke="#8651F2" strokeWidth="1.5" fill="none" />
      <line x1="14" y1="74" x2="114" y2="74" stroke="#8651F2" strokeWidth="1.5" />
      <path d="M22 52 Q64 60 106 52" stroke="#8651F2" strokeWidth="1.5" fill="none" />
      <path d="M22 96 Q64 88 106 96" stroke="#8651F2" strokeWidth="1.5" fill="none" />
      <rect x="82" y="68" width="58" height="42" rx="10" fill="#8651F2" />
      <polygon points="100,78 100,100 120,89" fill="white" />
      <rect x="72" y="102" width="24" height="12" rx="6" fill="#B186FF" stroke="white" strokeWidth="2"
        transform="rotate(-35 84 108)" />
      <rect x="88" y="110" width="24" height="12" rx="6" fill="#B186FF" stroke="white" strokeWidth="2"
        transform="rotate(-35 100 116)" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InputScreen({
  url,
  onChange,
  onExtract,
  isLoading = false,
  error = null,
  onDismissError,
  usageInfo,
}: Props) {
  const { t } = useLanguage();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  }
  const canExtract = url.trim().length > 0 && !isLoading;

  // Plan SC: FR-07 — show remaining count badge for tester
  const remainingBadge =
    usageInfo?.role === "tester" && usageInfo.remaining !== null ? (
      <span className="ml-2 inline-flex items-center rounded-full bg-infoBox px-2 py-0.5 text-[11px] font-medium text-accent-700">
        {usageInfo.remaining}회 남음
      </span>
    ) : null;

  // Plan SC: FR-07 — error messages via i18n
  function friendlyError(err: ExtractError): { title: string; hint?: string } {
    switch (err.code) {
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
      disabled={!canExtract && !isLoading}
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
          <span className="text-base">☆</span>
          {t("input.cta.extract")}
        </>
      )}
    </Button>
  );

  return (
    <PageShell
      topNav="videoai"
      bottomNav="home"
      className="pb-44 md:pb-16 lg:pb-20"
    >
      <PageHeader
        title={`👋 ${t("input.welcome")}`}
        trailing={
          <div className="flex items-center gap-2">
            {remainingBadge}
            <button className="text-text-tertiary p-1" aria-label="검색">
              <SearchIcon />
            </button>
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

      <div className="px-4 md:px-6 lg:grid lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:items-center lg:py-16">

        {/* ── Hero ── */}
        <div className="flex flex-col items-center lg:items-start">
          <div className="flex justify-center mt-8 lg:mt-0">
            <Illustration className="lg:w-52 lg:h-52" />
          </div>
          <h1 className="text-[21px] lg:text-3xl font-bold text-center lg:text-left text-text-primary mt-5 leading-tight whitespace-pre-line">
            {t("input.hero.title")}
          </h1>
          <p className="text-[13px] lg:text-sm text-text-tertiary text-center lg:text-left mt-3 leading-relaxed lg:px-0">
            {t("input.hero.desc")}
          </p>
        </div>

        {/* ── Input ── */}
        <div className="mt-9 lg:mt-0 md:max-w-xl md:mx-auto lg:max-w-none lg:mx-0">
          <p className="text-[13px] font-semibold text-text-secondary mb-2">{t("input.url.label")}</p>
          <div className="flex items-center bg-background border border-line-normal rounded-2xl px-4 py-[14px] shadow-sm focus-within:ring-2 focus-within:ring-accent-700 focus-within:ring-offset-1 transition-shadow">
            <input
              type="url"
              value={url}
              onChange={(e) => onChange(e.target.value)}
              placeholder={t("input.url.placeholder")}
              disabled={isLoading}
              className="flex-1 text-[13px] text-text-primary outline-none placeholder:text-text-disabled bg-transparent min-w-0 disabled:opacity-60"
            />
            {url && !isLoading && (
              <button onClick={() => onChange("")} className="ml-2 shrink-0" aria-label="Clear URL">
                <XCircleIcon />
              </button>
            )}
          </div>

          {shownError && (
            <Alert
              className="mt-4 py-2.5 px-3 border-danger-200 bg-danger-50 text-danger-800"
            >
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
                <button
                  onClick={onDismissError}
                  className="absolute right-2 top-2 p-1"
                  aria-label="Dismiss error"
                >
                  <DismissIcon />
                </button>
              )}
            </Alert>
          )}

          <div className="hidden md:block mt-6">
            {ctaButton}
          </div>
        </div>

      </div>

      {/* Fixed CTA — mobile only, sits above BottomNav (56px) */}
      <div className="fixed bottom-[56px] left-0 w-full px-4 py-3 bg-background md:hidden">
        {ctaButton}
      </div>
    </PageShell>
  );
}
