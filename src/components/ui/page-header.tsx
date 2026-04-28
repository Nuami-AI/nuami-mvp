"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title?: React.ReactNode;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, leading, trailing, className }: PageHeaderProps) {
  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-10 bg-background border-b border-line-neutral",
          "h-14 flex items-center justify-between px-4 md:hidden",
          className
        )}
      >
        {leading && <div className="shrink-0 mr-3">{leading}</div>}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          {title && (
            <span className="text-[18px] font-bold text-text-primary leading-tight truncate">
              {title}
            </span>
          )}
          {subtitle && (
            <span className="text-[12px] text-text-secondary leading-none mt-0.5">{subtitle}</span>
          )}
        </div>
        {trailing && <div className="shrink-0 ml-3">{trailing}</div>}
      </div>
      <div className="h-14 md:hidden" aria-hidden="true" />
    </>
  );
}
