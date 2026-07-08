"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import AdaptationGuidePanel from "@/components/guide/AdaptationGuidePanel";
import ContentDesktopHeader from "@/components/ContentDesktopHeader";
import ContentPageHeader from "@/components/ContentPageHeader";
import ContentSections from "@/components/ContentSections";
import CountryTabs from "@/components/CountryTabs";
import EmptyState from "@/components/EmptyState";
import { useLanguage } from "@/lib/i18n";
import type { ContentCountry, ContentPost } from "@/lib/content/types";

type CultureTab = "tips" | "adapt";

interface Props {
  posts: ContentPost[];
  country: ContentCountry;
}

function CultureTabs({ active, onChange }: { active: CultureTab; onChange: (tab: CultureTab) => void }) {
  const { t } = useLanguage();
  const tabs: { id: CultureTab; labelKey: "culture.tab.tips" | "culture.tab.adapt" }[] = [
    { id: "tips", labelKey: "culture.tab.tips" },
    { id: "adapt", labelKey: "culture.tab.adapt" },
  ];

  return (
    <div className="px-4 md:px-6 pt-4">
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold border-2 transition-colors ${
                isActive
                  ? "bg-accent-700 text-white border-accent-700 shadow-md"
                  : "bg-white text-text-secondary border-line-neutral hover:border-accent-300"
              }`}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CulturePageInner({ posts, country }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: CultureTab = tabParam === "adapt" ? "adapt" : "tips";

  function setTab(tab: CultureTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "tips") params.delete("tab");
    else params.set("tab", tab);
    const qs = params.toString();
    router.push(qs ? `/content?${qs}` : "/content", { scroll: false });
  }

  return (
    <>
      <CultureTabs active={activeTab} onChange={setTab} />

      {activeTab === "tips" ? (
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
              <EmptyState
                title={t("content.empty.title")}
                desc={t("content.empty.desc")}
              />
            </div>
          ) : (
            <ContentSections posts={posts} country={country} />
          )}
        </>
      ) : (
        <div className="mt-2 pb-8">
          <AdaptationGuidePanel />
        </div>
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
