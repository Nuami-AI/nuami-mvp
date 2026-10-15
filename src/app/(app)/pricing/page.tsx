"use client";

import PageShell from "@/components/PageShell";
import { PlansBoard } from "@/components/plans/PlansBoard";
import { PageHeader } from "@/components/ui/page-header";

export default function PricingPage() {
  return (
    <PageShell bottomNav="mypage">
      <PageHeader variant="sub" title="플랜 안내" backHref="/" />
      <div className="px-4 pb-12 pt-2 md:px-6 md:pt-8">
        <h1 className="mb-2 hidden text-[22px] font-bold text-text-primary md:block">플랜 안내</h1>
        <p className="mb-6 hidden text-[14px] text-text-secondary md:block">
          무료는 20회, 구독 후 Plus는 하루 40회, Premium은 하루 100회입니다. 결제는 아직 없습니다.
        </p>
        <PlansBoard />
      </div>
    </PageShell>
  );
}
