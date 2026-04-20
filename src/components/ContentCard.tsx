import Link from "next/link";
import type { ContentPost } from "@/lib/content/types";

const CATEGORY_LABELS: Record<string, string> = {
  culture: "문화",
  action: "행동",
  food: "음식",
  transport: "이동",
};

const COUNTRY_LABELS: Record<string, string> = {
  KR: "한국",
  JP: "일본",
};

export default function ContentCard({ post }: { post: ContentPost }) {
  return (
    <Link
      href={`/content/${post.id}`}
      className="block bg-card rounded-2xl p-4 border border-line-neutral shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[11px] font-medium bg-accent-100 text-accent-700 rounded-full px-2 py-0.5">
          {CATEGORY_LABELS[post.category] ?? post.category}
        </span>
        <span className="text-[11px] font-medium bg-infoBox text-text-secondary rounded-full px-2 py-0.5">
          {COUNTRY_LABELS[post.country] ?? post.country}
        </span>
      </div>

      <p className="text-[15px] font-bold text-text-primary leading-snug mb-1.5 line-clamp-2">
        {post.title}
      </p>

      <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2 mb-3">
        {post.summary}
      </p>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {post.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[11px] text-text-tertiary bg-infoBox rounded-full px-2 py-0.5"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
