export const KST = "Asia/Seoul";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국시간 오늘 0시 (UTC Date). daysBack=1 이면 어제 0시. */
export function kstDayStart(daysBack = 0): Date {
  const kst = new Date(Date.now() + KST_OFFSET_MS);
  kst.setUTCHours(0, 0, 0, 0);
  kst.setUTCDate(kst.getUTCDate() - daysBack);
  return new Date(kst.getTime() - KST_OFFSET_MS);
}

/** 한국시간 다음 날 0시. */
export function kstNextMidnight(): Date {
  return new Date(kstDayStart(0).getTime() + 24 * 60 * 60 * 1000);
}

const DATE_TIME: Intl.DateTimeFormatOptions = {
  timeZone: KST,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const DATE_ONLY: Intl.DateTimeFormatOptions = {
  timeZone: KST,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

const COMPACT: Intl.DateTimeFormatOptions = {
  timeZone: KST,
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 2026. 10. 14. 13:56 — 콘솔·로그·계정 공통 */
export function formatKstDateTime(value: Date | string | number | null | undefined, empty = "—"): string {
  const date = toDate(value);
  if (!date) return empty;
  return date.toLocaleString("ko-KR", DATE_TIME);
}

/** 2026. 10. 14. */
export function formatKstDate(value: Date | string | number | null | undefined, empty = "—"): string {
  const date = toDate(value);
  if (!date) return empty;
  return date.toLocaleDateString("ko-KR", DATE_ONLY);
}

/** 10월 14일 13:56 — 히스토리 등 짧은 표시 */
export function formatKstCompact(value: Date | string | number | null | undefined, empty = ""): string {
  const date = toDate(value);
  if (!date) return empty;
  return date.toLocaleString("ko-KR", COMPACT);
}

/** 2026.03.01 — 계약기간 표시. 없으면 0000.00.00 */
export function formatDotDate(value: Date | string | number | null | undefined): string | null {
  const date = toDate(value);
  if (!date) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/-/g, ".");
}

export function formatContractPeriod(
  start?: Date | string | number | null,
  end?: Date | string | number | null,
): string {
  return `${formatDotDate(start) ?? "0000.00.00"}-${formatDotDate(end) ?? "0000.00.00"}`;
}
