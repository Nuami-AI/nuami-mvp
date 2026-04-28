"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import ContentSectionRow from "@/components/ContentSectionRow";
import type { ContentPost, ContentCategory, ContentCountry } from "@/lib/content/types";
import type { TranslationKey } from "@/lib/i18n/ko";

const CATEGORY_TABS: { cat: ContentCategory | "all"; icon: string; label: string | TranslationKey }[] = [
  { cat: "all",       icon: "🌏", label: "전체" },
  { cat: "culture",   icon: "🏛️", label: "content.cat.culture" as TranslationKey },
  { cat: "action",    icon: "🗺️", label: "content.cat.action" as TranslationKey },
  { cat: "food",      icon: "🍜", label: "content.cat.food" as TranslationKey },
  { cat: "transport", icon: "🚆", label: "content.cat.transport" as TranslationKey },
];

const SECTION_CATEGORIES: ContentCategory[] = ["culture", "action", "food", "transport"];

interface Props {
  posts: ContentPost[];
  country: ContentCountry;
}

export default function ContentSections({ posts, country }: Props) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ContentCategory | "all">("all");

  const grouped = SECTION_CATEGORIES.reduce<Record<string, ContentPost[]>>((acc, cat) => {
    acc[cat] = posts.filter((p) => p.category === cat);
    return acc;
  }, {});

  const visibleCategories =
    activeTab === "all" ? SECTION_CATEGORIES : SECTION_CATEGORIES.filter((c) => c === activeTab);

  return (
    <div className="pb-8">
      {/* Icon category tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
        {CATEGORY_TABS.map(({ cat, icon, label }) => {
          const isActive = activeTab === cat;
          const displayLabel =
            cat === "all" ? "전체" : (t(label as TranslationKey) ?? String(label));
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex flex-col items-center gap-1 shrink-0 w-[60px] transition-opacity ${
                isActive ? "opacity-100" : "opacity-50"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-colors ${
                  isActive
                    ? "bg-accent-700 text-white"
                    : "bg-infoBox text-text-primary"
                }`}
              >
                {icon}
              </div>
              <span
                className={`text-[11px] leading-tight text-center ${
                  isActive ? "text-accent-700 font-semibold" : "text-text-secondary"
                }`}
              >
                {displayLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category sections */}
      {visibleCategories.map((cat) =>
        grouped[cat].length > 0 ? (
          <ContentSectionRow
            key={cat}
            category={cat}
            posts={grouped[cat]}
            country={country}
          />
        ) : null
      )}
    </div>
  );
}
