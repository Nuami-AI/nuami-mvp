"use client";

import { useSaves } from "@/lib/saves/hooks";
import type { SaveItemType } from "@/types/saves";

interface Props {
  type: SaveItemType;
  title: string;
  body?: string;
  situation: string;
  sourceUrl?: string;
  videoTitle?: string;
  emoji?: string;
  highlight?: boolean;
  saveable?: boolean;
  children?: React.ReactNode;
}

export default function SaveableItemCard({
  type,
  title,
  body,
  situation,
  sourceUrl,
  videoTitle,
  emoji = "📌",
  highlight = false,
  saveable = false,
  children,
}: Props) {
  const { save, remove, items } = useSaves();
  const existing = items.find((i) => i.type === type && i.title === title && i.situation === situation);
  const saved = Boolean(existing);

  function toggleSave() {
    if (!saveable) return;
    if (saved && existing) {
      remove(existing.id);
      return;
    }
    save({
      type,
      title,
      body,
      memo: "",
      checked: false,
      situation,
      sourceUrl,
      videoTitle,
    });
  }

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-colors ${
        highlight
          ? "border-accent-700 bg-accent-50 shadow-md"
          : saved
            ? "border-accent-300 bg-accent-50/40"
            : "border-line-neutral bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-[14px] font-bold leading-snug ${highlight ? "text-accent-800" : "text-text-primary"}`}>
              {title}
            </p>
            {saveable && (
              <button
                type="button"
                onClick={toggleSave}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border shrink-0 ${
                  saved
                    ? "border-accent-700 bg-accent-700 text-white"
                    : "border-line-neutral bg-white hover:border-accent-400"
                }`}
                aria-label={saved ? "저장 해제" : "저장"}
              >
                {saved ? "★" : "☆"}
              </button>
            )}
          </div>
          {body && (
            <p className="text-[12px] text-text-secondary mt-1 leading-relaxed line-clamp-3">{body}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

interface InfoItemProps {
  title: string;
  body?: string;
  emoji?: string;
  highlight?: boolean;
}

export function InfoItemCard({ title, body, emoji = "•", highlight = false }: InfoItemProps) {
  return (
    <div
      className={`rounded-xl border-2 px-4 py-3 ${
        highlight ? "border-accent-700 bg-accent-50" : "border-line-neutral bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0">{emoji}</span>
        <div className="min-w-0">
          <p className={`text-[14px] font-semibold leading-snug ${highlight ? "text-accent-800" : "text-text-primary"}`}>
            {title}
          </p>
          {body && <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">{body}</p>}
        </div>
      </div>
    </div>
  );
}
