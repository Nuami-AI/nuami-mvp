"use client";

import { useState } from "react";

interface ActionStep {
  id: number;
  text: string;
}

interface ActionCardProps {
  situation: string;
  steps: ActionStep[];
  keyPhrases: string[];
  onTryNow?: () => void;
}

export default function ActionCard({
  situation,
  steps,
  keyPhrases,
  onTryNow,
}: ActionCardProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-5 bg-white rounded-2xl shadow-md p-5 max-w-sm w-full mx-auto">
      {/* Situation */}
      <section>
        <span className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
          Situation
        </span>
        <p className="mt-1 text-sm text-neutral-700 leading-snug">{situation}</p>
      </section>

      <hr className="border-neutral-100" />

      {/* Action Steps */}
      <section>
        <span className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
          Action Steps
        </span>
        <ul className="mt-2 flex flex-col gap-2">
          {steps.map((step) => {
            const done = checked.has(step.id);
            return (
              <li
                key={step.id}
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => toggle(step.id)}
              >
                <span
                  className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    done
                      ? "bg-indigo-500 border-indigo-500"
                      : "border-neutral-300"
                  }`}
                >
                  {done && (
                    <svg
                      className="w-3 h-3 text-white"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span
                  className={`text-sm leading-snug transition-colors ${
                    done ? "line-through text-neutral-400" : "text-neutral-700"
                  }`}
                >
                  {step.text}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <hr className="border-neutral-100" />

      {/* Key Phrase */}
      <section>
        <span className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
          Key Phrase
        </span>
        <div className="mt-2 flex flex-col gap-2">
          {keyPhrases.map((phrase, i) => (
            <p
              key={i}
              className="text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2 leading-snug"
            >
              &ldquo;{phrase}&rdquo;
            </p>
          ))}
        </div>
      </section>

      {/* CTA */}
      <button
        onClick={onTryNow}
        className="w-full py-3 rounded-xl bg-indigo-500 text-white text-sm font-semibold tracking-wide active:scale-95 transition-transform"
      >
        Try now
      </button>
    </div>
  );
}
