"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import ContentDesktopHeader from "@/components/ContentDesktopHeader";
import ContentPageHeader from "@/components/ContentPageHeader";
import ContentSections from "@/components/ContentSections";
import CountryTabs from "@/components/CountryTabs";
import EmptyState from "@/components/EmptyState";
import { useLanguage } from "@/lib/i18n";
import type { ContentCountry, ContentPost } from "@/lib/content/types";

interface Props {
  posts: ContentPost[];
  country: ContentCountry;
}

function CulturePageInner({ posts, country }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("tab") === "adapt") {
      router.replace("/campus");
    }
  }, [router, searchParams]);

  if (searchParams.get("tab") === "adapt") return null;

  return (
    <>
      <ContentPageHeader />
      <ContentDesktopHeader />
      <div className="pt-2">
        <Suspense>
          <CountryTabs />
        </Suspense>
      </div>
      {posts.length === 0 ? (
        <div className="px-4 md:px-6 mt-4">
          <EmptyState title={t("content.empty.title")} desc={t("content.empty.desc")} />
        </div>
      ) : (
        <ContentSections posts={posts} country={country} />
      )}
    </>
  );
}

export default function CulturePageClient(props: Props) {
  return (
    <Suspense fallback={null}>
      <CulturePageInner {...props} />
    </Suspense>
  );
}
