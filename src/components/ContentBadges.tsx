"use client";

import { useLanguage } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

interface Props {
  category: string;
  country: string;
}

export default function ContentBadges({ category, country }: Props) {
  const { t } = useLanguage();

  const catKey = `content.cat.${category}` as Parameters<typeof t>[0];
  const countryKey = `content.country.${country.toLowerCase()}` as Parameters<typeof t>[0];

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="accent">{t(catKey) ?? category}</Badge>
      <Badge variant="info">{t(countryKey) ?? country}</Badge>
    </div>
  );
}
