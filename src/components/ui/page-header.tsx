"use client";

import * as React from "react";

import { HeaderIconButton } from "@/components/ui/header-icon";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type PageHeaderVariant = "home" | "top" | "sub" | "result";

interface PageHeaderProps {
  variant?: PageHeaderVariant;
  title?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  backHref?: string;
  onBack?: () => void;
  className?: string;
}

export function RemainingBadge({ count }: { count: number }) {
  const { t } = useLanguage();
  return (
    <span className="relative inline-flex items-center justify-center rounded px-1 py-[3px]">
      <span className="relative z-10 text-[11px] font-semibold leading-[1.27] tracking-[0.275px] text-accent-700 whitespace-nowrap">
        {t("input.remaining").replace("{count}", String(count))}
      </span>
      <span className="absolute inset-0 rounded bg-accent-700 opacity-[0.08]" aria-hidden />
    </span>
  );
}

export function HeaderTopActions() {
  const { t } = useLanguage();
  return (
    <div className="flex items-center">
      <HeaderIconButton name="notifications" label={t("header.notifications")} />
      <HeaderIconButton name="menu" href="/mypage" label={t("header.menu")} />
    </div>
  );
}

export function PageHeader({
  variant = "top",
  title,
  leading,
  trailing,
  backHref,
  onBack,
  className,
}: PageHeaderProps) {
  const { t } = useLanguage();
  const isHome = variant === "home";
  const isSub = variant === "sub" || variant === "result";
  const titleClass = isHome
    ? "text-[16px] font-semibold leading-[1.5] text-text-primary"
    : "text-[20px] font-semibold leading-[1.4] tracking-[-0.25px] text-text-primary";

  const resolvedTrailing =
    trailing ?? (variant === "top" ? <HeaderTopActions /> : null);

  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-10 flex h-16 items-center bg-white md:hidden",
          isSub ? "px-2" : "pl-4 pr-2",
          className,
        )}
      >
        <div className="relative mx-auto flex h-full w-full max-w-[1024px] items-center justify-between">
          {isSub ? (
            <HeaderIconButton
              name="back"
              label={t("common.back")}
              href={backHref}
              onClick={onBack}
            />
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              {leading ? <div className="shrink-0">{leading}</div> : null}
              {title ? (
                <span className={cn(titleClass, "truncate")}>{title}</span>
              ) : null}
            </div>
          )}

          {isSub && title ? (
            <span
              className={cn(
                titleClass,
                "pointer-events-none absolute left-1/2 top-1/2 max-w-[70%] -translate-x-1/2 -translate-y-1/2 truncate text-center",
              )}
            >
              {title}
            </span>
          ) : null}

          {resolvedTrailing ? (
            <div className="flex shrink-0 items-center gap-1">{resolvedTrailing}</div>
          ) : isSub ? (
            <div className="size-10 shrink-0" aria-hidden />
          ) : null}
        </div>
      </div>
      <div className="h-16 md:hidden" aria-hidden="true" />
    </>
  );
}
