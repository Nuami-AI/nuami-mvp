"use client";

import { useMemo, useState } from "react";

import {
  PLAN_COMPARE_FEATURES,
  PLANS,
  YEARLY_DISCOUNT,
  priceLabel,
  type BillingCycle,
  type PlanDef,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

function Check({ on }: { on: boolean | "inquiry" }) {
  if (on === "inquiry") {
    return <span className="text-[12px] font-medium text-accent-700">문의</span>;
  }
  if (!on) return <span className="text-text-disabled">—</span>;
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline text-accent-700" aria-hidden>
      <path d="M5 12.5 10 17.5 19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlanCard({ plan, cycle }: { plan: PlanDef; cycle: BillingCycle }) {
  const price = priceLabel(plan, cycle);
  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border bg-white p-5",
        plan.recommended ? "border-accent-700 shadow-[0_0_0_1px_#8651F2]" : "border-line-normal",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[15px] font-bold text-text-primary">{plan.name}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{plan.blurb}</p>
        </div>
        {plan.recommended ? (
          <span className="shrink-0 rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-semibold text-accent-800">
            추천
          </span>
        ) : null}
      </div>
      <p className="mt-4">
        {price.was ? (
          <span className="mr-2 text-[13px] text-text-disabled line-through">{price.was}</span>
        ) : null}
        <span className="text-[22px] font-bold tracking-tight text-text-primary">{price.current}</span>
      </p>
      {cycle === "yearly" && plan.monthlyWon != null && plan.monthlyWon > 0 ? (
        <p className="mt-1 text-[12px] font-medium text-accent-800">연간 결제 시 {Math.round(YEARLY_DISCOUNT * 100)}% 할인</p>
      ) : null}
      <ul className="mt-4 space-y-1.5 text-[13px] text-text-secondary">
        <li>· {plan.quotaLine}</li>
        {plan.diffs.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-2">
        {plan.monthlyWon === 0 ? (
          <p className="rounded-xl bg-infoBox px-3 py-2.5 text-center text-[12px] leading-relaxed text-text-tertiary">
            가입하면 바로 쓸 수 있는 무료 횟수입니다.
          </p>
        ) : (
          <p className="rounded-xl bg-infoBox px-3 py-2.5 text-center text-[12px] leading-relaxed text-text-tertiary">
            결제는 아직 열지 않았어요. 가격 안내만 확인해주세요.
          </p>
        )}
      </div>
    </article>
  );
}

function CompareTable({ plans }: { plans: PlanDef[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line-normal bg-white">
      <table className="w-full min-w-140 text-left text-[13px]">
        <thead>
          <tr className="border-b border-line-normal bg-gray-50">
            <th className="px-4 py-3 font-semibold text-text-tertiary">구분</th>
            {plans.map((plan) => (
              <th key={plan.id} className="px-3 py-3 font-semibold text-text-primary">
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line-neutral">
            <td className="px-4 py-3 text-text-secondary">안내 횟수</td>
            {plans.map((plan) => (
              <td key={plan.id} className="px-3 py-3 font-medium text-text-primary">
                {plan.quotaLabel}
              </td>
            ))}
          </tr>
          {PLAN_COMPARE_FEATURES.map((feature) => (
            <tr key={feature.key} className="border-b border-line-neutral last:border-0">
              <td className="px-4 py-3 text-text-secondary">{feature.label}</td>
              {plans.map((plan) => (
                <td key={plan.id} className="px-3 py-3">
                  <Check on={plan.features[feature.key] ?? false} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PlansBoard() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const b2c = useMemo(() => PLANS.filter((plan) => plan.audience === "b2c"), []);

  return (
    <div className="space-y-8">
      <p className="rounded-xl bg-accent-50 px-4 py-3 text-[13px] leading-relaxed text-accent-900">
        아래 가격은 현재 단계의 가설입니다. 확정 요금이 아니며, 결제는 준비 중입니다.
      </p>

      <div className="flex rounded-full bg-infoBox p-1">
        {(
          [
            { id: "monthly", label: "월정액" },
            { id: "yearly", label: "연간제" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCycle(tab.id)}
            className={cn(
              "h-10 flex-1 rounded-full text-[14px] font-semibold",
              cycle === tab.id ? "bg-white text-text-primary shadow-sm" : "text-text-tertiary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {cycle === "yearly" ? (
        <p className="text-[12px] text-text-tertiary">연간제는 월정액 12개월 합계에서 10% 할인한 총액입니다.</p>
      ) : null}

      <section>
        <div className="grid gap-3 md:grid-cols-3">{b2c.map((plan) => <PlanCard key={plan.id} plan={plan} cycle={cycle} />)}</div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[16px] font-bold text-text-primary">가격별 차이</h2>
        <CompareTable plans={b2c} />
        <p className="text-[12px] leading-relaxed text-text-tertiary">
          무료는 총 20회이며 날짜와 관계없이 다 쓸 때까지입니다. 다 쓰면 구독이 필요합니다. Plus는 하루 40회, Premium은
          하루 100회이며 한국시간 0시에 다시 채워집니다.
        </p>
      </section>
    </div>
  );
}
