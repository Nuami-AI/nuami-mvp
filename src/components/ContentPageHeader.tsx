"use client";

import { useLanguage } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function ContentPageHeader() {
  const { t } = useLanguage();
  return (
    <PageHeader
      title={t("content.title")}
      trailing={
        <button className="p-1.5 -mr-1 text-text-secondary hover:text-text-primary transition-colors">
          <SearchIcon />
        </button>
      }
    />
  );
}
