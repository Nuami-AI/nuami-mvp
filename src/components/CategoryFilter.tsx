"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/ko";

const CATEGORIES: { id: string; labelKey: TranslationKey }[] = [
  { id: "", labelKey: "content.cat.all" },
  { id: "culture", labelKey: "content.cat.culture" },
  { id: "action", labelKey: "content.cat.action" },
  { id: "food", labelKey: "content.cat.food" },
  { id: "transport", labelKey: "content.cat.transport" },
];

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "";
  const { t } = useLanguage();

  function handleSelect(id: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (id) {
      next.set("category", id);
    } else {
      next.delete("category");
    }
    next.delete("page");
    router.push(`/content?${next.toString()}`);
  }

  return (
    <div className="flex gap-2 px-4 overflow-x-auto scrollbar-none">
      {CATEGORIES.map(({ id, labelKey }) => {
        const isActive = current === id;
        return (
          <button
            key={id || "all"}
            onClick={() => handleSelect(id)}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
              isActive
                ? "bg-accent-700 text-text-foreground"
                : "bg-infoBox text-text-secondary hover:bg-gray-200"
            }`}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
