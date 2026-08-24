export const PROVIDER_TYPES = [
  "PUBLIC_AGENCY",
  "UNIVERSITY",
  "FOREIGNER_SUPPORT",
  "PARTNER",
  "EXPERT",
  "OTHER",
] as const;

export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const PROVIDER_TYPE_LABEL: Record<ProviderType, string> = {
  PUBLIC_AGENCY: "공공기관",
  UNIVERSITY: "대학",
  FOREIGNER_SUPPORT: "외국인지원기관",
  PARTNER: "파트너사",
  EXPERT: "외부 전문가",
  OTHER: "기타",
};

export const PROVIDER_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

export const ASSET_DOMAINS = [
  "housing",
  "stay",
  "hospital",
  "campus",
  "bank",
  "other",
] as const;

export type AssetDomain = (typeof ASSET_DOMAINS)[number];

export const ASSET_DOMAIN_LABEL: Record<AssetDomain, string> = {
  housing: "주거",
  stay: "체류",
  hospital: "병원",
  campus: "학교생활",
  bank: "금융",
  other: "기타",
};

export const ASSET_SOURCE_TYPES = ["PDF", "DOCUMENT", "URL", "TEXT"] as const;
export type AssetSourceType = (typeof ASSET_SOURCE_TYPES)[number];

export const ASSET_STATUSES = [
  "PENDING_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "ON_HOLD",
  "INACTIVE",
] as const;

export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = {
  PENDING_REVIEW: "검토대기",
  APPROVED: "승인",
  PUBLISHED: "반영",
  ON_HOLD: "보류",
  INACTIVE: "비활성",
};

/** Only PUBLISHED assets may enter AI / search. */
export const AI_USABLE_ASSET_STATUS: AssetStatus = "PUBLISHED";

export function isProviderType(value: string): value is ProviderType {
  return (PROVIDER_TYPES as readonly string[]).includes(value);
}

export function isAssetDomain(value: string): value is AssetDomain {
  return (ASSET_DOMAINS as readonly string[]).includes(value);
}

export function isAssetSourceType(value: string): value is AssetSourceType {
  return (ASSET_SOURCE_TYPES as readonly string[]).includes(value);
}

export function isAssetStatus(value: string): value is AssetStatus {
  return (ASSET_STATUSES as readonly string[]).includes(value);
}
