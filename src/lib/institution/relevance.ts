/** Korea academic year: YYYY학년도 1학기 Mar–Aug, 2학기 Sep–Feb. */

export interface AcademicTermContext {
  nowLabel: string;
  academicYear: number;
  term: 1 | 2;
  phase: "upcoming" | "current" | "wrapping";
  promptLine: string;
}

export function koreaAcademicContext(now = new Date()): AcademicTermContext {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const nowLabel = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  if (month === 8) {
    return {
      nowLabel,
      academicYear: year,
      term: 2,
      phase: "upcoming",
      promptLine: `Today is ${nowLabel} (Korea). ${year}학년도 1학기 is ending; ${year}학년도 2학기 (fall) is about to start. Audience is NEW inbound international students (신입 유학생 / 후기 신입), not continuing Korean students and not faculty. Keep only arrival/first-term procedures for that cohort.`,
    };
  }
  if (month >= 3 && month <= 7) {
    return {
      nowLabel,
      academicYear: year,
      term: 1,
      phase: month >= 7 ? "wrapping" : "current",
      promptLine: `Today is ${nowLabel} (Korea). We are in ${year}학년도 1학기. Audience is NEW inbound international students this term, not continuing-student campus news.`,
    };
  }
  if (month >= 9 && month <= 12) {
    return {
      nowLabel,
      academicYear: year,
      term: 2,
      phase: "current",
      promptLine: `Today is ${nowLabel} (Korea). We are in ${year}학년도 2학기. Audience is NEW inbound international students this term.`,
    };
  }
  const academicYear = year - 1;
  return {
    nowLabel,
    academicYear,
    term: 2,
    phase: month === 2 ? "wrapping" : "current",
    promptLine: `Today is ${nowLabel} (Korea). We are in ${academicYear}학년도 2학기 (ends February). Audience is NEW inbound international students this term.`,
  };
}

const BLOCK = [
  /교수\s*(초빙|채용)|직원\s*채용|공개채용|채용\s*공고|자체계약직|사업자\s*(선정|모집)|입찰|계약직/i,
  /연구조교|조교\s*모집|TA\s*모집|RA\s*모집/i,
  /recruit|hiring|faculty\s*position|job\s*opening/i,
  /해외\s*파견|단기\s*파견|정규학기\s*해외|pnu\s*will|어학연수\s*또는\s*계절수업/i,
  /outbound|dispatch\s*program/i,
  /성료|회의록|심의위원회|핵심역량\s*진단|후배\s*진로|경력\s*up|멘토\s*모집|학술행사|효원장터|분실물/i,
  /학위수여식|졸업식/i,
  /국가장학금/,
  /환영\s*메시지|협정|693개\s*기관|문창회관|효원가족/i,
  /보험\s*사업자/,
  /창업|경진대회|아이디어\s*대회|해커톤|공모전/i,
  /식단|급식\s*안내|메뉴\s*안내/i,
  /개축|리모델링|공사\s*안내|철거/i,
  /도서관\s*안내|주제\s*도서관|6-subject|6주제/i,
];

const INTL = /외국인|유학생|국제학생|international\s*student|inbound|초청\s*교환|d-2|체류|비자|외국인등록|\barc\b/i;
const NEWCOMER = /신입생|편입생|후기\s*신입|오리엔테이션|입학\s*(안내|faq|관련)|orientation/i;
const FIRST_NEED = /기숙사|대학생활원|입사|국민건강보험|건강보험|국제처|해외결제|등록금|수강신청|버디|buddy|유학생\s*장학|외국인\s*.*장학/i;
const CURRENT_ONLY = /재학생(?!\s*및\s*신입)|기존\s*재학/;

function isIncomingInternationalFocus(hay: string): boolean {
  if (CURRENT_ONLY.test(hay) && !INTL.test(hay) && !NEWCOMER.test(hay)) return false;
  if (INTL.test(hay) && FIRST_NEED.test(hay)) return true;
  if (INTL.test(hay) && NEWCOMER.test(hay)) return true;
  if (INTL.test(hay) && /지원\s*(프로그램|안내|서비스)|연락처|위치/.test(hay)) return true;
  if (NEWCOMER.test(hay) && /등록금|기숙|입학|오리엔|비자|외국인/.test(hay)) return true;
  return false;
}

function haystackOf(input: { title: string; summary?: string; facts?: string[]; keywords?: string[] }): string {
  return [input.title, input.summary ?? "", ...(input.facts ?? []), ...(input.keywords ?? [])].join(" ");
}

function mentionsCurrentOrUpcomingTerm(text: string, ctx: AcademicTermContext): boolean {
  const year = ctx.academicYear;
  const term = ctx.term;
  const other = term === 1 ? 2 : 1;
  if (new RegExp(`${year}\\s*학년도\\s*${other}\\s*학기`).test(text) && ctx.phase !== "upcoming") {
    return false;
  }
  if (new RegExp(`${year}\\s*학년도\\s*${term}\\s*학기`).test(text)) return true;
  if (ctx.phase === "upcoming" && new RegExp(`${year}\\s*학년도\\s*2\\s*학기`).test(text)) return true;
  if (new RegExp(`${year - 1}\\s*학년도`).test(text) && !new RegExp(`${year}`).test(text)) return false;
  return true;
}

/** User-facing campus cards: inbound international students + evergreen basics for the current term. */
export function isInboundStudentKnowledge(input: {
  title: string;
  summary?: string;
  facts?: string[];
  keywords?: string[];
}, now = new Date()): boolean {
  const hay = haystackOf(input);
  if (BLOCK.some((re) => re.test(hay))) return false;
  const ctx = koreaAcademicContext(now);
  if (!mentionsCurrentOrUpcomingTerm(hay, ctx)) return false;
  if (/(교환학생|파견)/.test(hay) && !INTL.test(hay)) return false;
  return isIncomingInternationalFocus(hay);
}

export function filterInboundStudentKnowledge<T extends {
  title: string;
  summary?: string;
  facts?: string[];
  keywords?: string[];
}>(items: T[], now = new Date()): T[] {
  return items.filter((item) => isInboundStudentKnowledge(item, now));
}
