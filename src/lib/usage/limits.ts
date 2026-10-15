export const FREE_CREDITS = 20;
export const PLUS_DAILY_LIMIT = 40;
export const PREMIUM_DAILY_LIMIT = 100;
/** AuthUser.creditsLimit 저장값. 예전 기본값 100과 겹치지 않게 101을 씁니다. */
export const PREMIUM_STORED_LIMIT = 101;

export type AppPlanId = "basic" | "plus" | "premium";

export interface AppPlan {
  id: AppPlanId;
  limit: number;
  daily: boolean;
  storedLimit: number;
}

export const APP_PLANS: Record<AppPlanId, AppPlan> = {
  basic: { id: "basic", limit: FREE_CREDITS, daily: false, storedLimit: FREE_CREDITS },
  plus: { id: "plus", limit: PLUS_DAILY_LIMIT, daily: true, storedLimit: PLUS_DAILY_LIMIT },
  premium: { id: "premium", limit: PREMIUM_DAILY_LIMIT, daily: true, storedLimit: PREMIUM_STORED_LIMIT },
};

export const PLAN_SELECT_OPTIONS: Array<{ value: number; label: string }> = [
  { value: FREE_CREDITS, label: "무료 · 20회 (소진 시까지)" },
  { value: PLUS_DAILY_LIMIT, label: "Plus · 하루 40회 · 0시 초기화" },
  { value: PREMIUM_STORED_LIMIT, label: "Premium · 하루 100회 · 0시 초기화" },
];

export function resolveAppPlan(creditsLimit: number | null | undefined): AppPlan {
  if (creditsLimit === PLUS_DAILY_LIMIT) return APP_PLANS.plus;
  if (creditsLimit === PREMIUM_STORED_LIMIT) return APP_PLANS.premium;
  return APP_PLANS.basic;
}

export function storedPlanLimit(creditsLimit: number | null | undefined): number {
  return resolveAppPlan(creditsLimit).storedLimit;
}

/** @deprecated 유료 Premium 일일 한도와 같은 값. 새 코드는 resolveAppPlan 을 쓰세요. */
export const DAILY_USAGE_LIMIT = PREMIUM_DAILY_LIMIT;
