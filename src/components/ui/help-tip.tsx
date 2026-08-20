"use client";

import { cn } from "@/lib/utils";

/** 원형 물음표. 호버·키보드 포커스 시 짧은 설명을 말풍선으로 보여 줍니다. */
export function HelpTip({
  label,
  text,
  side = "bottom",
  className,
}: {
  label: string;
  text: string;
  side?: "top" | "bottom";
  className?: string;
}) {
  const balloonPos =
    side === "top"
      ? "bottom-[calc(100%+6px)]"
      : "top-[calc(100%+6px)]";

  return (
    <span className={cn("relative inline-flex align-middle", className)}>
      <button
        type="button"
        aria-label={label}
        className="peer inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-300 text-[10px] leading-none text-gray-500 hover:border-gray-500 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none invisible absolute left-1/2 z-30 w-[13.5rem] -translate-x-1/2 rounded-lg bg-gray-900 px-2.5 py-2 text-left text-[11px] font-normal leading-relaxed text-white opacity-0 shadow-lg peer-hover:visible peer-hover:opacity-100 peer-focus:visible peer-focus:opacity-100 peer-focus-visible:visible peer-focus-visible:opacity-100",
          balloonPos,
        )}
      >
        {text}
      </span>
    </span>
  );
}
