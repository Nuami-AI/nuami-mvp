"use client";

import Link from "next/link";
import PageShell from "@/components/PageShell";
import { PageHeader } from "@/components/ui/page-header";
import { useLanguage } from "@/lib/i18n";

export function MypageSectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useLanguage();

  return (
    <PageShell topNav="mypage" bottomNav="mypage">
      <PageHeader variant="sub" title={title} backHref="/mypage" />
      <div className="px-4 md:px-6 pt-4 md:pt-8 pb-10">
        <Link href="/mypage" className="mb-4 hidden items-center gap-1 text-[13px] text-text-tertiary md:inline-flex">
          ← {t("mypage.title")}
        </Link>
        <h1 className="mb-6 hidden text-[20px] font-semibold text-text-primary md:block">{title}</h1>
        {children}
      </div>
    </PageShell>
  );
}
