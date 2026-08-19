"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/ko";

type CategoryId = "admin" | "leisure" | "food" | "housing" | "transport" | "school";

const CATEGORIES: {
  id: CategoryId;
  icon: string;
  examples: TranslationKey[];
}[] = [
  {
    id: "admin",
    icon: "🏛️",
    examples: [
      "input.example.admin.bank",
      "input.example.admin.address",
      "input.example.admin.hospital",
    ],
  },
  {
    id: "leisure",
    icon: "🛍️",
    examples: [
      "input.example.leisure.discount",
      "input.example.leisure.shopping",
      "input.example.leisure.hotitem",
      "input.example.leisure.hotplace",
    ],
  },
  {
    id: "food",
    icon: "🍜",
    examples: [
      "input.example.food.dinein",
      "input.example.food.delivery",
      "input.example.food.mart",
      "input.example.food.online",
    ],
  },
  {
    id: "housing",
    icon: "🏠",
    examples: [
      "input.example.housing.rent",
      "input.example.housing.utilities",
      "input.example.housing.contract",
      "input.example.housing.dorm",
    ],
  },
  {
    id: "transport",
    icon: "🚇",
    examples: [
      "input.example.transport.subway",
      "input.example.transport.bus",
      "input.example.transport.express",
      "input.example.transport.airport",
    ],
  },
  {
    id: "school",
    icon: "🎓",
    examples: [
      "input.example.school.professor",
      "input.example.school.enroll",
      "input.example.school.admin",
      "input.example.school.study",
    ],
  },
];

interface Props {
  situation: string;
  onSituationChange: (value: string) => void;
  disabled?: boolean;
}

export default function ExampleCategoryPicker({
  situation,
  onSituationChange,
  disabled = false,
}: Props) {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const active = activeCategory
    ? CATEGORIES.find((c) => c.id === activeCategory) ?? null
    : null;

  function handleExampleClick(exampleKey: TranslationKey, categoryId: CategoryId) {
    const label = t(exampleKey);
    setActiveCategory(categoryId);
    onSituationChange(situation === label ? "" : label);
  }

  return (
    <div className="space-y-2.5">
      <div className="flex justify-center gap-2 flex-wrap">
        {CATEGORIES.map(({ id, icon }) => {
          const isActive = activeCategory === id;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveCategory(isActive ? null : id)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all",
                isActive
                  ? "bg-accent-700 border-accent-700 text-white shadow-md scale-105"
                  : "bg-white border-line-neutral hover:border-accent-300",
                disabled && "pointer-events-none opacity-40",
              )}
              aria-label={id}
            >
              {icon}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="flex flex-wrap justify-center gap-2">
          {active.examples.map((exampleKey) => {
            const label = t(exampleKey);
            const isSelected = situation === label;
            return (
              <button
                key={exampleKey}
                type="button"
                disabled={disabled}
                onClick={() => handleExampleClick(exampleKey, active.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[13px] font-semibold border-2 transition-colors",
                  isSelected
                    ? "bg-accent-700 text-white border-accent-700 shadow-sm"
                    : "bg-white text-text-secondary border-line-neutral hover:border-accent-400 hover:text-accent-700",
                  disabled && "opacity-50 pointer-events-none",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
