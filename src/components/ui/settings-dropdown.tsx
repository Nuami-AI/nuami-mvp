"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface SettingsDropdownOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export function SettingsDropdown<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: SettingsDropdownOption<T>[];
  onChange: (value: T) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = options.find((row) => row.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const button = buttonRef.current;
    const list = listRef.current;
    if (!button || !list) return;
    const rect = button.getBoundingClientRect();
    const height = list.offsetHeight;
    const gap = 4;
    const openUp = rect.bottom + gap + height > window.innerHeight - 8 && rect.top - gap - height > 8;
    setPos({
      top: openUp ? rect.top - height - gap : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
    });
  }, [open, options.length]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-line-normal bg-white px-4 text-left"
      >
        <span className="min-w-0 truncate text-[14px] font-semibold text-text-primary">{selected?.label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open
        ? createPortal(
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              style={pos ? { top: pos.top, left: pos.left, width: pos.width } : { top: 0, left: 0, visibility: "hidden" }}
              className="fixed z-50 max-h-64 overflow-auto rounded-xl border border-line-normal bg-white py-1 shadow-lg"
            >
              {options.map((row) => {
                const active = row.value === value;
                return (
                  <li key={row.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(row.value);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${
                        active ? "bg-accent-50 text-accent-700" : "text-text-primary hover:bg-muted"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold">{row.label}</span>
                        {row.hint ? <span className="mt-0.5 block text-[12px] text-text-tertiary">{row.hint}</span> : null}
                      </span>
                      {active ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
                          <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
