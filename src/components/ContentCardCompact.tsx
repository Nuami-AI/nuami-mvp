"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import type { ContentPost } from "@/lib/content/types";
import type { TranslationKey } from "@/lib/i18n/ko";

const CATEGORY_META: Record<string, { gradient: string; icon: string }> = {
  culture:   { gradient: "from-purple-50 to-accent-100",  icon: "🏛️" },
  action:    { gradient: "from-blue-50 to-indigo-100",    icon: "🗺️" },
  food:      { gradient: "from-amber-50 to-orange-100",   icon: "🍜" },
  transport: { gradient: "from-emerald-50 to-teal-100",   icon: "🚆" },
};

interface Props {
  post: ContentPost;
  compact?: boolean;
}

export default function ContentCardCompact({ post, compact = false }: Props) {
  const { t } = useLanguage();
  const meta = CATEGORY_META[post.category] ?? { gradient: "from-gray-50 to-gray-100", icon: "📄" };
  const catKey = `content.cat.${post.category}` as TranslationKey;
  const catLabel = t(catKey) ?? post.category;

  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).replace(/\. /g, ".").replace(/\.$/, "")
    : "";

  const href = `/content/${post.id}?country=${post.country}&category=${post.category}`;

  if (compact) {
    /* 리스트 스타일: 썸네일 좌 + 텍스트 우 */
    return (
      <Link href={href} className="flex gap-3 py-3 group">
        <div
          className={`bg-gradient-to-br ${meta.gradient} rounded-xl w-16 h-16 shrink-0 flex items-center justify-center`}
        >
          <span className="text-2xl opacity-50 select-none">{meta.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-text-primary leading-snug line-clamp-2 group-hover:text-accent-700 transition-colors">
            {post.title}
          </p>
          <p className="text-[12px] text-text-secondary leading-snug line-clamp-1 mt-0.5">
            {post.summary}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[11px] text-text-tertiary">{date}</span>
            <span className="text-text-tertiary text-[10px]">·</span>
            <Badge variant="accent" className="text-[10px] py-0 h-4">{catLabel}</Badge>
            <Badge variant="info" className="text-[10px] py-0 h-4">{post.country}</Badge>
          </div>
        </div>
      </Link>
    );
  }

  /* 가로 스크롤 landscape 카드 */
  return (
    <Link href={href} className="block w-[200px] shrink-0 group">
      <div
        className={`bg-gradient-to-br ${meta.gradient} rounded-2xl h-[120px] flex items-center justify-center overflow-hidden`}
      >
        <span className="text-5xl opacity-30 select-none">{meta.icon}</span>
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-[13px] font-semibold text-text-primary leading-snug line-clamp-2 group-hover:text-accent-700 transition-colors">
          {post.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {date && <span className="text-[11px] text-text-tertiary">{date}</span>}
          {date && <span className="text-text-tertiary text-[10px]">·</span>}
          <Badge variant="accent" className="text-[10px] py-0 h-4">{catLabel}</Badge>
          <Badge variant="info" className="text-[10px] py-0 h-4">{post.country}</Badge>
        </div>
      </div>
    </Link>
  );
}
