"use client";

import { useLanguage } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";

export default function ContentPageHeader() {
  const { t } = useLanguage();
  return <PageHeader variant="top" title={t("content.title")} />;
}
