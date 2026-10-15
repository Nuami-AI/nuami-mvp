import { FREE_CREDITS, PLUS_DAILY_LIMIT, PREMIUM_DAILY_LIMIT } from "@/lib/usage/limits";

export const PLAN_INQUIRY_EMAIL = (process.env.NEXT_PUBLIC_INQUIRY_EMAIL ?? "admin@nuami.kr").trim();
export const YEARLY_DISCOUNT = 0.1;

export function yearlyTotalFromMonthly(monthlyWon: number): number {
  return Math.round(monthlyWon * 12 * (1 - YEARLY_DISCOUNT));
}

export function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export type PlanAudience = "b2c" | "university";
export type BillingCycle = "monthly" | "yearly";

export interface PlanFeature {
  key: string;
  label: string;
}

export const PLAN_COMPARE_FEATURES: PlanFeature[] = [
  { key: "guide", label: "상황별 생활 가이드" },
  { key: "campus", label: "소속 대학 맞춤 안내" },
  { key: "location", label: "위치 기반 가까운 장소" },
  { key: "history", label: "이용 기록·북마크" },
  { key: "priority", label: "더 자세한 우선 안내" },
];

export interface PlanDef {
  id: string;
  audience: PlanAudience;
  name: string;
  blurb: string;
  monthlyWon: number | null;
  yearlyWon: number | null;
  yearlyLabel?: string;
  recommended?: boolean;
  inquiry?: boolean;
  quotaLabel: string;
  quotaLine: string;
  features: Record<string, boolean | "inquiry">;
  diffs: string[];
}

export const PLANS: PlanDef[] = [
  {
    id: "basic",
    audience: "b2c",
    name: "Basic",
    blurb: "처음 한국 생활을 시작하는 무료 플랜",
    monthlyWon: 0,
    yearlyWon: 0,
    quotaLabel: `${FREE_CREDITS}회 · 소진 시까지`,
    quotaLine: `총 ${FREE_CREDITS}회 · 하루 제한 없음 · 다 쓰면 구독 필요`,
    features: {
      guide: true,
      campus: false,
      location: false,
      history: false,
      priority: false,
    },
    diffs: ["핵심 생활 가이드"],
  },
  {
    id: "plus",
    audience: "b2c",
    name: "Plus",
    blurb: "대학 생활과 주변 장소를 맞춰 주는 1단계 구독",
    monthlyWon: 2900,
    yearlyWon: yearlyTotalFromMonthly(2900),
    quotaLabel: `하루 ${PLUS_DAILY_LIMIT}회`,
    quotaLine: `하루 ${PLUS_DAILY_LIMIT}회 · 한국시간 0시 초기화`,
    features: {
      guide: true,
      campus: true,
      location: true,
      history: true,
      priority: false,
    },
    diffs: ["소속 대학 맞춤", "위치 기반 추천", "기록·북마크"],
  },
  {
    id: "premium",
    audience: "b2c",
    name: "Premium",
    blurb: "더 촘촘한 안내가 필요할 때 쓰는 2단계 구독",
    monthlyWon: 4900,
    yearlyWon: yearlyTotalFromMonthly(4900),
    recommended: true,
    quotaLabel: `하루 ${PREMIUM_DAILY_LIMIT}회`,
    quotaLine: `하루 ${PREMIUM_DAILY_LIMIT}회 · 한국시간 0시 초기화`,
    features: {
      guide: true,
      campus: true,
      location: true,
      history: true,
      priority: true,
    },
    diffs: ["Plus 전부", "우선·상세 안내"],
  },
];

export function priceLabel(plan: PlanDef, cycle: BillingCycle): { current: string; was?: string } {
  if (plan.yearlyLabel && (cycle === "yearly" || plan.monthlyWon == null)) {
    return { current: plan.yearlyLabel };
  }
  if (cycle === "monthly") {
    if (plan.monthlyWon === 0) return { current: "무료" };
    if (plan.monthlyWon == null) return { current: plan.yearlyLabel ?? "문의" };
    return { current: `월 ${formatWon(plan.monthlyWon)}` };
  }
  if (plan.yearlyWon === 0) return { current: "무료" };
  if (plan.yearlyWon == null) return { current: plan.yearlyLabel ?? "문의" };
  const full = plan.monthlyWon != null ? plan.monthlyWon * 12 : null;
  return {
    current: `연 ${formatWon(plan.yearlyWon)}`,
    was: full != null ? `연 ${formatWon(full)}` : undefined,
  };
}
