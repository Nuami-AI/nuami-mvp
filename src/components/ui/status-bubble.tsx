import * as React from "react";

import { cn } from "@/lib/utils";

export type StatusTone = "ready" | "progress" | "done" | "danger";

const TONE: Record<StatusTone, string> = {
  ready: "bg-status-ready-bg text-status-ready",
  progress: "bg-status-progress-bg text-status-progress",
  done: "bg-status-done-bg text-status-done",
  danger: "bg-danger-50 text-danger-700",
};

export function StatusBubble({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
