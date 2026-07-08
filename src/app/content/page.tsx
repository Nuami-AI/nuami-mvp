import { getContentPosts } from "@/lib/content/queries";
import CulturePageClient from "@/components/culture/CulturePageClient";
import PageShell from "@/components/PageShell";
import type { ContentPost, ContentCountry } from "@/lib/content/types";

const VALID_COUNTRIES = ["KR", "JP"];

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; category?: string; page?: string; tab?: string }>;
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
    <PageShell topNav="culture" bottomNav="culture">
      <CulturePageClient posts={posts} country={country} />
    </PageShell>
  );
}
