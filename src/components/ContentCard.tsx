"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ContentPost } from "@/lib/content/types";
import type { TranslationKey } from "@/lib/i18n/ko";

const CATEGORY_META: Record<string, { gradient: string; icon: string }> = {
  culture: { gradient: "from-purple-50 to-accent-100", icon: "🎭" },
  action:  { gradient: "from-blue-50 to-indigo-100",   icon: "🏃" },
  food:    { gradient: "from-amber-50 to-orange-100",  icon: "🍜" },
  transport: { gradient: "from-emerald-50 to-teal-100", icon: "🚆" },
};

export default function ContentCard({ post, featured = false }: { post: ContentPost; featured?: boolean }) {
  const { t } = useLanguage();

  const catKey = `content.cat.${post.category}` as TranslationKey;
  const countryKey = `content.country.${post.country.toLowerCase()}` as TranslationKey;
  const meta = CATEGORY_META[post.category] ?? { gradient: "from-gray-50 to-gray-100", icon: "📄" };

  return (
    <Link href={`/content/${post.id}?country=${post.country}&category=${post.category}`} className="block group">
      <Card className="overflow-hidden border-line-neutral transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5">
        {/* Thumbnail */}
        <div className={`bg-gradient-to-br ${meta.gradient} flex items-center justify-center ${featured ? "h-[140px]" : "h-[96px]"}`}>
          <span className={`${featured ? "text-5xl" : "text-3xl"} opacity-50 select-none`}>{meta.icon}</span>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Badge variant="accent">{t(catKey) ?? post.category}</Badge>
            <Badge variant="info">{t(countryKey) ?? post.country}</Badge>
          </div>

          <p className={`font-bold text-text-primary leading-snug mb-1.5 line-clamp-2 ${featured ? "text-[17px]" : "text-[15px]"}`}>
            {post.title}
          </p>

          <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">
            {post.summary}
          </p>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[11px] text-text-tertiary bg-infoBox rounded-full px-2 py-0.5">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
