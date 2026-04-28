"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import ContentCardCompact from "@/components/ContentCardCompact";
import type { ContentPost, ContentCategory } from "@/lib/content/types";
import type { TranslationKey } from "@/lib/i18n/ko";

const CATEGORY_META: Record<
  string,
  { sectionTitle: (country: string) => string; sectionLabelKey: TranslationKey; compact?: boolean }
> = {
  culture:   { sectionTitle: (c) => `${c}의 문화 가이드`,   sectionLabelKey: "content.cat.culture" },
  action:    { sectionTitle: (c) => `${c}의 행동 가이드`,   sectionLabelKey: "content.cat.action" },
  food:      { sectionTitle: (c) => `${c}의 음식 가이드`,   sectionLabelKey: "content.cat.food" },
  transport: { sectionTitle: (c) => `${c}의 리얼팁`,        sectionLabelKey: "content.cat.transport", compact: true },
};

const COUNTRY_LABEL: Record<string, string> = { KR: "한국", JP: "일본" };

interface Props {
  category: ContentCategory;
  posts: ContentPost[];
  country: string;
}

export default function ContentSectionRow({ category, posts, country }: Props) {
  const { t } = useLanguage();
  const meta = CATEGORY_META[category];
  if (!meta || posts.length === 0) return null;

  const countryLabel = COUNTRY_LABEL[country] ?? country;
  const sectionTitle = meta.sectionTitle(countryLabel);
  const moreHref = `/content?country=${country}&category=${category}`;

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between px-4 md:px-6 mb-3">
        <h2 className="text-[16px] font-bold text-text-primary">{sectionTitle}</h2>
        <Link href={moreHref} className="text-[13px] text-accent-700 font-medium hover:underline">
          모두 보기
        </Link>
      </div>

      {meta.compact ? (
        /* Compact list layout (리얼팁) */
        <div className="flex flex-col gap-0 divide-y divide-line-neutral px-4 md:px-6">
          {posts.slice(0, 4).map((post) => (
            <ContentCardCompact key={post.id} post={post} compact />
          ))}
        </div>
      ) : (
        /* Horizontal scroll landscape cards */
        <div className="flex gap-3 overflow-x-auto px-4 md:px-6 pb-1 scrollbar-hide">
          {posts.map((post) => (
            <ContentCardCompact key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
