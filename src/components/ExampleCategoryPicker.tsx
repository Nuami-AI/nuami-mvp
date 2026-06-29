"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/ko";

type CategoryId = "leisure" | "food" | "housing" | "transport" | "school";

const CATEGORIES: {
  id: CategoryId;
  tabKey: TranslationKey;
  icon: string;
  examples: TranslationKey[];
}[] = [
  {
    id: "leisure",
    tabKey: "input.tab.leisure",
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
    tabKey: "input.tab.food",
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
    tabKey: "input.tab.housing",
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
    tabKey: "input.tab.transport",
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
    tabKey: "input.tab.school",
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
    <div className="space-y-3">
      <p className="text-[12px] text-text-tertiary text-center">{t("input.examples.hint")}</p>

      <div className="flex justify-center gap-2 flex-wrap pb-0.5">
        {CATEGORIES.map(({ id, tabKey, icon }) => {
          const isActive = activeCategory === id;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveCategory(isActive ? null : id)}
              className={cn(
                "flex flex-col items-center gap-1 shrink-0 w-[60px] transition-opacity",
                isActive ? "opacity-100" : "opacity-55 hover:opacity-80",
                disabled && "pointer-events-none opacity-40",
              )}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center text-lg transition-colors",
                  isActive
                    ? "bg-accent-700 text-white shadow-sm"
                    : "bg-infoBox text-text-primary",
                )}
              >
                {icon}
              </div>
              <span
                className={cn(
                  "text-[11px] leading-tight text-center whitespace-nowrap",
                  isActive ? "text-accent-700 font-semibold" : "text-text-secondary",
                )}
              >
                {t(tabKey)}
              </span>
            </button>
          );
        })}
      </div>

      {active ? (
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
                  "px-3 py-2 rounded-full text-[13px] font-medium border transition-colors",
                  isSelected
                    ? "bg-accent-700 text-white border-accent-700"
                    : "bg-background text-text-secondary border-line-normal hover:border-accent-300 hover:text-accent-700",
                  disabled && "opacity-50 pointer-events-none",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-[12px] text-text-disabled">
          카테고리를 선택하면 예시 검색어가 나타나요
        </p>
      )}
    </div>
  );
}
