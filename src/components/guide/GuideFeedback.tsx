"use client";

import { useEffect, useId, useState } from "react";
import type { TranslationKey } from "@/lib/i18n";
import { scopedStorageKey } from "@/lib/user/storage-scope";

interface Props {
  open: boolean;
  situation: string;
  scenarioId?: string;
  t: (k: TranslationKey) => string;
  /** Called after user rates, marks complete, or dismisses — then leave the results screen. */
  onFinished: () => void;
}

const STORAGE_BASE = "nuami_guide_feedback_gate";
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const SITUATION_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const SHOW_PROBABILITY = 0.4;

type GateState = {
  lastShownAt: number;
  bySituation: Record<string, number>;
};

function hashSituation(situation: string): string {
  let h = 0;
  const s = situation.trim().slice(0, 200);
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

function readGate(): GateState {
  try {
    const raw = localStorage.getItem(scopedStorageKey(STORAGE_BASE));
    if (!raw) return { lastShownAt: 0, bySituation: {} };
    const parsed = JSON.parse(raw) as GateState;
    return {
      lastShownAt: typeof parsed.lastShownAt === "number" ? parsed.lastShownAt : 0,
      bySituation: parsed.bySituation && typeof parsed.bySituation === "object" ? parsed.bySituation : {},
    };
  } catch {
    return { lastShownAt: 0, bySituation: {} };
  }
}

function writeGate(state: GateState): void {
  try {
    localStorage.setItem(scopedStorageKey(STORAGE_BASE), JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

/** One-shot / occasional survey: not every leave, not for the same guide soon. */
export function shouldOfferGuideFeedback(situation: string): boolean {
  if (typeof window === "undefined") return false;
  const now = Date.now();
  const gate = readGate();
  const key = hashSituation(situation);
  const lastForSituation = gate.bySituation[key] ?? 0;
  if (now - lastForSituation < SITUATION_COOLDOWN_MS) return false;
  if (now - gate.lastShownAt < COOLDOWN_MS) return false;
  return Math.random() < SHOW_PROBABILITY;
}

export function markGuideFeedbackOffered(situation: string): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const gate = readGate();
  gate.lastShownAt = now;
  gate.bySituation[hashSituation(situation)] = now;
  writeGate(gate);
}

async function logUsage(action: "guide_completed" | "guide_rated", metadata: object) {
  await fetch("/api/usage/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, metadata }),
  }).catch(() => {});
}

export default function GuideFeedbackModal({
  open,
  situation,
  scenarioId,
  t,
  onFinished,
}: Props) {
  const titleId = useId();
  const [rated, setRated] = useState<"helpful" | "unclear" | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setRated(null);
      setCompleted(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={() => onFinished()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border-2 border-line-neutral bg-white p-5 shadow-xl space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p id={titleId} className="text-[15px] font-bold text-text-primary leading-snug">
          {t("results.feedback.prompt")}
        </p>
        <p className="text-[12px] text-text-secondary leading-relaxed">{t("results.feedback.surveyHint")}</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={rated !== null}
            onClick={() => {
              setRated("helpful");
              void logUsage("guide_rated", { situation, scenarioId, rating: "helpful" });
            }}
            className={`flex-1 rounded-xl border-2 py-2.5 text-[13px] font-semibold ${
              rated === "helpful"
                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                : "border-line-neutral bg-white text-text-primary"
            }`}
          >
            {t("results.feedback.helpful")}
          </button>
          <button
            type="button"
            disabled={rated !== null}
            onClick={() => {
              setRated("unclear");
              void logUsage("guide_rated", { situation, scenarioId, rating: "unclear" });
            }}
            className={`flex-1 rounded-xl border-2 py-2.5 text-[13px] font-semibold ${
              rated === "unclear"
                ? "border-amber-500 bg-amber-50 text-amber-900"
                : "border-line-neutral bg-white text-text-primary"
            }`}
          >
            {t("results.feedback.unclear")}
          </button>
        </div>
        {rated && <p className="text-[12px] text-text-secondary">{t("results.feedback.thanks")}</p>}
        <button
          type="button"
          disabled={completed}
          onClick={() => {
            setCompleted(true);
            void logUsage("guide_completed", { situation, scenarioId });
          }}
          className={`w-full rounded-xl py-2.5 text-[13px] font-bold border-2 ${
            completed
              ? "border-accent-700 bg-accent-700 text-white"
              : "border-accent-700 text-accent-700 bg-accent-50"
          }`}
        >
          {completed ? t("results.feedback.done") : t("results.feedback.complete")}
        </button>
        <button
          type="button"
          onClick={() => onFinished()}
          className="w-full rounded-xl py-2.5 text-[13px] font-semibold text-text-secondary hover:bg-infoBox"
        >
          {rated || completed ? t("results.feedback.leave") : t("results.feedback.skip")}
        </button>
      </div>
    </div>
  );
}
