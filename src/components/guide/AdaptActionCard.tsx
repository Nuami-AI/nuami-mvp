"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { GuideCard, QuizQuestion } from "@/lib/guide/adapt-cards";
import { StatusBubble } from "@/components/ui/status-bubble";
import { useLanguage } from "@/lib/i18n";

function QuizVerification({ quiz, onPass }: { quiz: QuizQuestion; onPass: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [wrong, setWrong] = useState(false);
  const passed = selected === quiz.answerIndex;

  function handleSelect(i: number) {
    if (passed) return;
    setSelected(i);
    if (i === quiz.answerIndex) setWrong(false);
    else setWrong(true);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-neutral bg-infoBox px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">확인 퀴즈</p>
      <p className="text-[13px] font-medium leading-relaxed text-text-primary">{quiz.question}</p>
      <div className="grid grid-cols-1 gap-2">
        {quiz.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === quiz.answerIndex;
          let cls = "rounded-lg px-3 py-2 text-left text-[13px] border transition-all ";
          if (isSelected && isCorrect) cls += "border-emerald-400 bg-emerald-50 font-medium text-emerald-800";
          else if (isSelected && !isCorrect) cls += "border-red-300 bg-red-50 text-red-700";
          else cls += "border-line-neutral bg-background text-text-secondary md:hover:border-accent-300 md:hover:bg-accent-50";
          return (
            <button key={i} type="button" className={cls} onClick={() => handleSelect(i)}>
              {isSelected && isCorrect ? "✓ " : ""}
              {opt}
            </button>
          );
        })}
      </div>
      {wrong && !passed ? <p className="text-[12px] text-red-500">틀렸어요. 카드를 다시 읽고 선택해보세요!</p> : null}
      {passed ? (
        <button
          type="button"
          onClick={onPass}
          className="w-full rounded-xl bg-accent-700 py-2.5 text-[13px] font-semibold text-white active:scale-95"
        >
          ✓ 해봤어요! 완료 표시
        </button>
      ) : null}
    </div>
  );
}

function TimerVerification({ seconds, onPass }: { seconds: number; onPass: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const passed = remaining <= 0;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (passed) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [passed]);

  const pct = Math.round(((seconds - remaining) / seconds) * 100);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-neutral bg-infoBox px-4 py-4">
      {!passed ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-text-tertiary">읽는 동안 자동으로 완료 가능해져요</p>
            <span className="tabular-nums text-[13px] font-bold text-accent-700">{remaining}초</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-accent-400 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={onPass}
          className="w-full rounded-xl bg-accent-700 py-2.5 text-[13px] font-semibold text-white active:scale-95"
        >
          ✓ 내용을 확인했어요! 완료 표시
        </button>
      )}
    </div>
  );
}

function ChecklistVerification({
  items,
  onPass,
  hint,
  doneLabel,
}: {
  items: string[];
  onPass: () => void;
  hint: string;
  doneLabel: string;
}) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const allOn = checked.length > 0 && checked.every(Boolean);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-neutral bg-infoBox px-4 py-4">
      <p className="text-[12px] text-text-tertiary">{hint}</p>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <button
            key={item}
            type="button"
            onClick={() =>
              setChecked((prev) => {
                const next = [...prev];
                next[i] = !next[i];
                return next;
              })
            }
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-[13px] ${
              checked[i]
                ? "border-accent-300 bg-white text-text-primary"
                : "border-line-neutral bg-background text-text-secondary"
            }`}
          >
            <span
              className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded text-[10px] text-white ${
                checked[i] ? "bg-accent-700" : "bg-[rgba(138,137,129,0.35)]"
              }`}
            >
              {checked[i] ? "✓" : ""}
            </span>
            {item}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!allOn}
        onClick={onPass}
        className="w-full rounded-xl bg-accent-700 py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
      >
        {doneLabel}
      </button>
    </div>
  );
}

export function AdaptActionCard({
  card,
  done,
  onDone,
  forceOpen,
  checkHint,
  checkedLabel,
}: {
  card: GuideCard;
  done: boolean;
  onDone: (id: string) => void;
  forceOpen?: boolean;
  checkHint: string;
  checkedLabel: string;
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(Boolean(forceOpen));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!forceOpen) return;
    setExpanded(true);
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [forceOpen]);

  const handlePass = useCallback(() => {
    onDone(card.id);
    setExpanded(false);
  }, [card.id, onDone]);

  return (
    <div
      ref={rootRef}
      id={`card-${card.id}`}
      className={`scroll-mt-20 rounded-2xl border border-line-neutral transition-all duration-200 ${
        forceOpen && !done ? "bg-white shadow-sm" : done ? "bg-white" : "bg-card"
      }`}
    >
      <button type="button" className="flex w-full items-start gap-3 px-5 pb-3 pt-4 text-left" onClick={() => setExpanded((v) => !v)}>
        <span className="mt-0.5 shrink-0 text-2xl">{card.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={`text-[15px] font-bold leading-snug ${done ? "text-text-secondary" : "text-text-primary"}`}>{card.title}</p>
            {card.badge ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                {card.badge}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 line-clamp-1 text-[12px] leading-relaxed text-text-tertiary">{card.situation}</p>
        </div>
        <div className="mt-0.5 flex shrink-0 items-center gap-2">
          {done ? (
            <StatusBubble tone="done">{t("status.done")}</StatusBubble>
          ) : expanded ? (
            <StatusBubble tone="progress">{t("status.progress")}</StatusBubble>
          ) : (
            <StatusBubble tone="ready">{t("status.ready")}</StatusBubble>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-text-disabled transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          >
            <path d="m4 6 4 4 4-4" />
          </svg>
        </div>
      </button>

      {expanded ? (
        <div className="flex flex-col gap-4 border-t border-line-neutral/50 px-5 pb-5 pt-4">
          <p className="text-[12px] leading-relaxed text-text-secondary">{card.situation}</p>
          <ol className="flex flex-col gap-2.5">
            {card.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-text-primary">
                  {i + 1}
                </span>
                <span className="text-[13px] leading-relaxed text-text-secondary">{step}</span>
              </li>
            ))}
          </ol>
          {card.phrases && card.phrases.length > 0 ? (
            <div className="flex flex-col gap-1.5 rounded-xl bg-infoBox px-4 py-3">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">현지 표현</p>
              {card.phrases.map((p) => (
                <div key={p.native} className="flex items-baseline gap-2">
                  <span className="whitespace-nowrap text-[13px] font-semibold text-text-primary">{p.native}</span>
                  <span className="text-[12px] text-text-tertiary">— {p.meaning}</span>
                </div>
              ))}
            </div>
          ) : null}
          {card.tip ? (
            <div className="flex items-start gap-2 border-t border-line-neutral pt-3">
              <span className="shrink-0 text-[13px]">💡</span>
              <p className="text-[12px] leading-relaxed text-text-tertiary">{card.tip}</p>
            </div>
          ) : null}
          {!done && card.verification === "quiz" && card.quiz ? <QuizVerification quiz={card.quiz} onPass={handlePass} /> : null}
          {!done && card.verification === "timer" ? <TimerVerification seconds={card.timerSec ?? 20} onPass={handlePass} /> : null}
          {!done && card.verification === "checklist" && card.checklist ? (
            <ChecklistVerification items={card.checklist} onPass={handlePass} hint={checkHint} doneLabel={checkedLabel} />
          ) : null}
          {done ? (
            <button
              type="button"
              onClick={() => {
                onDone(card.id);
                setExpanded(false);
              }}
              className="w-full rounded-xl bg-gray-100 py-2 text-[13px] font-medium text-text-secondary"
            >
              완료 취소하기
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
