import { Suspense } from "react";
import { getContentPosts } from "@/lib/content/queries";
import ContentDesktopHeader from "@/components/ContentDesktopHeader";
import CountryTabs from "@/components/CountryTabs";
import ContentPageHeader from "@/components/ContentPageHeader";
import ContentSections from "@/components/ContentSections";
import PageShell from "@/components/PageShell";
import EmptyState from "@/components/EmptyState";
import type { ContentPost, ContentCountry } from "@/lib/content/types";

const VALID_COUNTRIES = ["KR", "JP"];

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

  let posts: ContentPost[] = [];
  try {
    const result = await getContentPosts({ country, limit: 50 });
    posts = result.data;
  } catch {
    // DB not available — render empty state
  }

  return (
    <PageShell topNav="content" bottomNav="content">
      {/* Mobile sticky header */}
      <ContentPageHeader />

      {/* Desktop hero header */}
      <ContentDesktopHeader />

      {/* Country tabs */}
      <div className="pt-4">
        <Suspense>
          <CountryTabs />
        </Suspense>
      </div>

      {posts.length === 0 ? (
        <div className="px-4 md:px-6 mt-4">
          <EmptyState
            title="아직 콘텐츠가 없어요"
            desc="다른 국가를 선택하거나 나중에 다시 확인하세요"
          />
        </div>
      ) : (
        <ContentSections posts={posts} country={country} />
      )}
    </PageShell>
  );
}
