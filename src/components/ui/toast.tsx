"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "warning" | "danger";

const ICONS: Record<ToastVariant, string | null> = {
  default: null,
  success: "/icons/toast/success.svg",
  warning: "/icons/toast/warning.svg",
  danger: "/icons/toast/error.svg",
};

const HOLD_MS = 5000;
const ANIM_MS = 300;

export function Toast({
  message,
  variant = "success",
  onDismiss,
}: {
  message: string;
  variant?: ToastVariant;
  onDismiss?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!message) return;
    setPhase("in");
    const hide = window.setTimeout(() => setPhase("out"), HOLD_MS);
    const done = window.setTimeout(() => onDismissRef.current?.(), HOLD_MS + ANIM_MS);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(done);
    };
  }, [message]);

  if (!mounted || !message) return null;

  const icon = ICONS[variant];

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-6 bottom-6 z-60 flex justify-center md:inset-x-auto md:left-1/2 md:bottom-auto md:top-6 md:-translate-x-1/2"
    >
      <div
        className={cn(
          "flex min-h-14 w-fit min-w-50 max-w-[min(20rem,100%)] items-center justify-center gap-2.5 rounded-xl bg-[#0A0A0A]/80 px-6 py-4 shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)]",
          phase === "out" ? "toast-leave" : "toast-enter",
        )}
      >
        {icon ? (
          <span className="relative size-6 shrink-0 overflow-hidden">
            <img src={icon} alt="" width={24} height={24} className="size-6" />
          </span>
        ) : null}
        <p className="line-clamp-2 min-w-0 text-center text-[14px] font-semibold leading-[1.43] tracking-[0.175px] text-white">
          {message}
        </p>
      </div>
    </div>,
    document.body,
  );
}
