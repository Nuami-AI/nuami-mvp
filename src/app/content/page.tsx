import { Suspense } from "react";
import { getContentPosts } from "@/lib/content/queries";
import ContentCard from "@/components/ContentCard";
import CountryTabs from "@/components/CountryTabs";
import CategoryFilter from "@/components/CategoryFilter";
import ContentPageHeader from "@/components/ContentPageHeader";
import PageShell from "@/components/PageShell";
import EmptyState from "@/components/EmptyState";
import type { ContentPost, ContentCountry, ContentCategory } from "@/lib/content/types";

const VALID_COUNTRIES = ["KR", "JP"];
const VALID_CATEGORIES = ["culture", "action", "food", "transport"];

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;

  const country =
    params.country && VALID_COUNTRIES.includes(params.country)
      ? (params.country as ContentCountry)
      : "KR";
  const category =
    params.category && VALID_CATEGORIES.includes(params.category)
      ? (params.category as ContentCategory)
      : undefined;
  const page = parseInt(params.page ?? "1", 10);

  let posts: ContentPost[] = [];
  try {
    const result = await getContentPosts({ country, category, page, limit: 12 });
    posts = result.data;
  } catch {
    // DB not available — render empty state
  }

  return (
    <PageShell topNav="content" bottomNav="content">
      <ContentPageHeader />

      <div className="space-y-3 pb-4">
        <Suspense>
          <CountryTabs />
        </Suspense>
        <Suspense>
          <CategoryFilter />
        </Suspense>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          title="아직 콘텐츠가 없어요"
          desc="다른 카테고리를 선택하거나 나중에 다시 확인하세요"
        />
      ) : (
        <div className="px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {posts.map((post) => (
            <ContentCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
