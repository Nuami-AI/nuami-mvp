"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

interface GuideCard {
  id: string;
  emoji: string;
  title: string;
  situation: string;
  steps: string[];
  tip?: string;
  phrases?: { native: string; meaning: string }[];
  verification: "quiz" | "timer";
  quiz?: QuizQuestion;
  timerSec?: number;
}

interface GuideSection {
  id: string;
  label: string;
  bgClass: string;
  textClass: string;
  cards: GuideCard[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Static data
// ──────────────────────────────────────────────────────────────────────────────

const SECTIONS: GuideSection[] = [
  {
    id: "cafe",
    label: "카페·식당",
    bgClass: "bg-amber-100",
    textClass: "text-amber-700",
    cards: [
      {
        id: "kiosk",
        emoji: "☕",
        title: "카페 키오스크 주문하기",
        situation: "스타벅스·투썸 등 대형 카페에서 처음 키오스크로 주문할 때",
        steps: [
          "매장 입구나 계산대 옆 키오스크 화면을 터치해 시작",
          "'매장 이용' 또는 '포장(테이크아웃)' 중 선택",
          "원하는 음료 선택 → 사이즈·온도·샷 옵션 설정",
          "'장바구니 담기' → '결제하기'",
          "카드 단말기에 터치 or 카카오페이·네이버페이 QR 결제",
        ],
        tip: "영수증 번호 기억해두기 — 화면이나 스피커로 번호를 불러줄 때 픽업하면 됩니다.",
        verification: "quiz",
        quiz: {
          question: "키오스크에서 음료를 고르기 전 가장 먼저 선택하는 것은?",
          options: ["음료 메뉴 바로 선택", "매장이용 / 포장 선택", "결제하기", "장바구니 담기"],
          answerIndex: 1,
        },
      },
      {
        id: "restaurant",
        emoji: "🍜",
        title: "식당에서 직접 주문하기",
        situation: "테이블 오더 없이 직원에게 말로 주문해야 할 때",
        steps: [
          "자리에 앉은 뒤 메뉴판을 받거나 QR코드 스캔",
          "원하는 메뉴를 정한 뒤 손을 들거나 직원 부르기",
          "메뉴 이름 + '주세요' 로 주문 (예: '김치찌개 하나 주세요')",
          "여러 개면 '두 개 주세요', '세 개 주세요' 추가",
          "계산할 때 '계산해 주세요' 또는 카드를 들고 손 흔들기",
        ],
        phrases: [
          { native: "여기요!", meaning: "직원 부를 때" },
          { native: "이거 주세요", meaning: "메뉴 짚으며 주문" },
          { native: "계산해 주세요", meaning: "계산서 요청" },
          { native: "포장해 주세요", meaning: "테이크아웃 요청" },
        ],
        verification: "quiz",
        quiz: {
          question: "식당에서 직원을 부를 때 맞는 표현은?",
          options: ["저기요!", "여기요!", "안녕하세요!", "감사합니다!"],
          answerIndex: 1,
        },
      },
    ],
  },
  {
    id: "delivery",
    label: "배달앱",
    bgClass: "bg-rose-100",
    textClass: "text-rose-700",
    cards: [
      {
        id: "baemin",
        emoji: "🛵",
        title: "배달의민족으로 첫 주문하기",
        situation: "한국 배달앱을 처음 사용할 때",
        steps: [
          "App Store 또는 Play Store에서 '배달의민족' 설치",
          "회원가입(전화번호 인증 필요) → 배달 주소 등록",
          "홈에서 카테고리 선택하거나 검색창에 메뉴 검색",
          "가게 선택 → 메뉴 담기 → '주문하기'",
          "결제 방법 선택 (카드 등록 or 카카오페이) → 주문 완료",
          "'주문 현황'에서 실시간 배달 위치 확인 가능",
        ],
        verification: "quiz",
        quiz: {
          question: "빠른 단건 배달을 원할 때 선택하는 배민 탭은?",
          options: ["일반배달", "배민1", "가게배달", "편의점"],
          answerIndex: 1,
        },
        tip: "'배민1'은 단건 배달(빠르지만 배달비 높음), 일반 배달은 합배달(저렴)입니다.",
      },
    ],
  },
  {
    id: "hospital",
    label: "병원·약국",
    bgClass: "bg-sky-100",
    textClass: "text-sky-700",
    cards: [
      {
        id: "clinic",
        emoji: "🏥",
        title: "동네 의원 처음 방문하기",
        situation: "감기·소화불량 등 가벼운 증상으로 예약 없이 병원 갈 때",
        steps: [
          "네이버지도·카카오맵에서 '내과' 또는 '가정의학과' 검색",
          "접수 창구에서 외국인등록증(또는 여권) + 건강보험증 제시",
          "'처음 오셨나요?' 물으면 '네, 처음이에요' 라고 답하기",
          "문진표 작성 (한국어/영어 겸용인 경우 많음)",
          "진찰 후 처방전 받기 → 근처 약국으로 이동",
        ],
        tip: "대부분의 동네 의원은 예약 없이 방문 가능합니다. 건강보험 가입자는 진료비 30%만 부담해요.",
        phrases: [
          { native: "여기가 아파요", meaning: "아픈 부위 짚으며" },
          { native: "열이 나요", meaning: "발열 증상" },
          { native: "소화가 안 돼요", meaning: "소화불량" },
          { native: "며칠째 기침이 나요", meaning: "기침 지속" },
        ],
        verification: "timer",
        timerSec: 20,
      },
      {
        id: "pharmacy",
        emoji: "💊",
        title: "처방전으로 약국 이용하기",
        situation: "의원에서 처방전을 받은 뒤 약을 받을 때",
        steps: [
          "병원 근처 약국 방문 — 십자(+) 표시 간판이 약국이에요",
          "처방전 + 외국인등록증(or 건강보험증) 창구에 제출",
          "번호 또는 이름으로 호출될 때까지 대기",
          "약사의 복용법 설명 듣기 (1일 3회, 식후 30분 등)",
        ],
        tip: "처방전은 발행일로부터 3일 이내에만 사용 가능합니다.",
        verification: "timer",
        timerSec: 20,
      },
    ],
  },
  {
    id: "admin",
    label: "비자·행정",
    bgClass: "bg-purple-100",
    textClass: "text-purple-700",
    cards: [
      {
        id: "alien-card",
        emoji: "🪪",
        title: "외국인등록증 신청하기",
        situation: "입국 후 90일 이내에 반드시 해야 하는 필수 절차",
        steps: [
          "하이코리아(hikorea.go.kr)에서 방문 예약",
          "관할 출입국·외국인청 방문 (예약증 지참)",
          "현장에서 신청서 작성 (양식 무료 배부)",
          "제출: 여권 + 사진 1장 + 재학증명서(유학생) + 수수료 3만원",
          "접수 완료 → 약 2~3주 후 문자 안내 시 수령",
        ],
        tip: "예약 없이 방문하면 대기가 매우 길 수 있어요. 반드시 미리 예약하세요.",
        verification: "timer",
        timerSec: 20,
      },
      {
        id: "community-center",
        emoji: "🏛️",
        title: "주민센터 처음 가기",
        situation: "전입신고, 증명서 발급, 건강보험 관련 문의가 필요할 때",
        steps: [
          "거주지 관할 주민센터(동사무소) 방문 — 외국인등록증 지참",
          "입구에서 번호표 뽑기",
          "담당 창구 호출 시 이동 후 필요한 업무 말하기",
          "'영어 할 수 있는 분 있으세요?' — 통역 요청 가능",
        ],
        tip: "주요 서비스: 전입신고, 거주 확인서, 건강보험 관련 문의, 각종 증명서 발급",
        verification: "timer",
        timerSec: 20,
      },
    ],
  },
  {
    id: "transport",
    label: "교통",
    bgClass: "bg-emerald-100",
    textClass: "text-emerald-700",
    cards: [
      {
        id: "tmoney",
        emoji: "🚇",
        title: "교통카드(T-money) 발급·사용하기",
        situation: "지하철·버스를 처음 탈 때 교통카드 준비하기",
        steps: [
          "편의점(CU, GS25, 세븐일레븐)에서 T-money 카드 구매 — 약 2,500원",
          "같은 편의점 또는 지하철 역 내 충전기에서 충전 (1만원 이상 권장)",
          "지하철·버스 탑승 시 카드 단말기에 터치 (삑 소리 나면 성공)",
          "하차 시에도 반드시 다시 터치 — 안 하면 추가 요금 부과",
        ],
        tip: "네이버지도·카카오맵 모두 영어·일어 지원합니다. 환승 경로와 소요시간 확인에 최적이에요.",
        verification: "quiz",
        quiz: {
          question: "버스·지하철 하차 시 카드 태그를 안 하면?",
          options: ["괜찮다", "경고 문자가 온다", "추가 요금이 부과된다", "카드가 정지된다"],
          answerIndex: 2,
        },
      },
    ],
  },
];

const ALL_CARD_IDS = SECTIONS.flatMap((s) => s.cards.map((c) => c.id));
const TOTAL = ALL_CARD_IDS.length;

const STORAGE_DONE_KEY = "nuami-guide-done";
const STORAGE_BONUS_KEY = "nuami-guide-bonus-claimed";

function loadDone(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_DONE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}
function saveDone(done: Set<string>) {
  try { localStorage.setItem(STORAGE_DONE_KEY, JSON.stringify([...done])); } catch {}
}
function loadBonusClaimed(): boolean {
  try { return localStorage.getItem(STORAGE_BONUS_KEY) === "1"; } catch { return false; }
}
function saveBonusClaimed() {
  try { localStorage.setItem(STORAGE_BONUS_KEY, "1"); } catch {}
}

// ──────────────────────────────────────────────────────────────────────────────
// Quiz component
// ──────────────────────────────────────────────────────────────────────────────

function QuizVerification({ quiz, onPass }: { quiz: QuizQuestion; onPass: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [wrong, setWrong] = useState(false);
  const passed = selected === quiz.answerIndex;

  function handleSelect(i: number) {
    if (passed) return;
    setSelected(i);
    if (i === quiz.answerIndex) {
      setWrong(false);
    } else {
      setWrong(true);
    }
  }

  return (
    <div className="rounded-xl border border-line-neutral bg-infoBox px-4 py-4 flex flex-col gap-3">
      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">확인 퀴즈</p>
      <p className="text-[13px] font-medium text-text-primary leading-relaxed">{quiz.question}</p>
      <div className="grid grid-cols-1 gap-2">
        {quiz.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === quiz.answerIndex;
          let cls = "rounded-lg px-3 py-2 text-[13px] text-left border transition-all ";
          if (isSelected && isCorrect) cls += "border-emerald-400 bg-emerald-50 text-emerald-800 font-medium";
          else if (isSelected && !isCorrect) cls += "border-red-300 bg-red-50 text-red-700";
          else cls += "border-line-neutral bg-background text-text-secondary md:hover:border-accent-300 md:hover:bg-accent-50";
          return (
            <button key={i} className={cls} onClick={() => handleSelect(i)}>
              {isSelected && isCorrect && "✓ "}{opt}
            </button>
          );
        })}
      </div>
      {wrong && !passed && (
        <p className="text-[12px] text-red-500">틀렸어요. 카드를 다시 읽고 선택해보세요!</p>
      )}
      {passed && (
        <button
          onClick={onPass}
          className="w-full rounded-xl py-2.5 bg-accent-500 text-white text-[13px] font-semibold active:bg-accent-600 active:scale-95 transition-all"
        >
          ✓ 해봤어요! 완료 표시
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Timer component
// ──────────────────────────────────────────────────────────────────────────────

function TimerVerification({ seconds, onPass }: { seconds: number; onPass: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const passed = remaining <= 0;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (passed) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [passed]);

  const pct = Math.round(((seconds - remaining) / seconds) * 100);

  return (
    <div className="rounded-xl border border-line-neutral bg-infoBox px-4 py-4 flex flex-col gap-3">
      {!passed ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-text-tertiary">읽는 동안 자동으로 완료 가능해져요</p>
            <span className="text-[13px] font-bold text-accent-600 tabular-nums">{remaining}초</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-400 transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      ) : (
        <button
          onClick={onPass}
          className="w-full rounded-xl py-2.5 bg-accent-500 text-white text-[13px] font-semibold active:bg-accent-600 active:scale-95 transition-all"
        >
          ✓ 내용을 확인했어요! 완료 표시
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// ActionCard
// ──────────────────────────────────────────────────────────────────────────────

function ActionCard({
  card,
  done,
  onDone,
}: {
  card: GuideCard;
  done: boolean;
  onDone: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const handlePass = useCallback(() => {
    onDone(card.id);
    setExpanded(false);
  }, [card.id, onDone]);

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${done ? "bg-accent-50 border-accent-200" : "bg-card border-line-neutral"}`}>
      {/* Header */}
      <button
        className="w-full text-left px-5 pt-4 pb-3 flex items-start gap-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-2xl mt-0.5 shrink-0">{card.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-[15px] leading-snug ${done ? "text-accent-800" : "text-text-primary"}`}>
            {card.title}
          </p>
          <p className="text-[12px] text-text-tertiary mt-0.5 leading-relaxed line-clamp-1">{card.situation}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {done && <span className="text-[11px] font-semibold text-accent-600 bg-accent-100 rounded-full px-2 py-0.5">완료</span>}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-text-disabled transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
            <path d="m4 6 4 4 4-4" />
          </svg>
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t border-line-neutral/50 pt-4">
          <p className="text-[12px] text-text-secondary leading-relaxed">{card.situation}</p>

          <ol className="flex flex-col gap-2.5">
            {card.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent-200 text-accent-800 text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-[13px] text-text-secondary leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>

          {card.phrases && card.phrases.length > 0 && (
            <div className="rounded-xl bg-infoBox px-4 py-3 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-0.5">현지 표현</p>
              {card.phrases.map((p, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <span className="font-semibold text-[13px] text-text-primary whitespace-nowrap">{p.native}</span>
                  <span className="text-[12px] text-text-tertiary">— {p.meaning}</span>
                </div>
              ))}
            </div>
          )}

          {card.tip && (
            <div className="flex items-start gap-2 border-t border-line-neutral pt-3">
              <span className="text-[13px] shrink-0">💡</span>
              <p className="text-[12px] text-text-tertiary leading-relaxed">{card.tip}</p>
            </div>
          )}

          {/* Verification */}
          {!done && (
            card.verification === "quiz" && card.quiz
              ? <QuizVerification quiz={card.quiz} onPass={handlePass} />
              : <TimerVerification seconds={card.timerSec ?? 20} onPass={handlePass} />
          )}

          {done && (
            <button
              onClick={() => { /* allow un-done */ onDone(card.id); setExpanded(false); }}
              className="w-full rounded-xl py-2 bg-accent-100 text-accent-700 text-[13px] font-medium active:bg-accent-200 transition-colors"
            >
              완료 취소하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Credit Reward banner
// ──────────────────────────────────────────────────────────────────────────────

function CreditRewardBanner({ onClaim, claimed }: { onClaim: () => Promise<void>; claimed: boolean }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ remaining?: number; error?: string } | null>(null);

  async function handleClaim() {
    setLoading(true);
    try {
      await onClaim();
      setResult({ remaining: undefined });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "오류가 발생했습니다";
      setResult({ error: msg });
    } finally {
      setLoading(false);
    }
  }

  if (claimed || result) {
    return (
      <div className="mx-4 md:mx-6 rounded-2xl bg-accent-100 border border-accent-200 px-5 py-5 text-center">
        <p className="text-xl mb-1">🎉</p>
        <p className="text-[14px] font-bold text-accent-800">크레딧 +2 지급 완료!</p>
        <p className="text-[12px] text-accent-700 mt-1">Video AI를 2번 더 사용할 수 있어요</p>
        {result?.error && <p className="text-[11px] text-red-500 mt-1">{result.error}</p>}
      </div>
    );
  }

  return (
    <div className="mx-4 md:mx-6 rounded-2xl bg-gradient-to-br from-accent-100 to-purple-100 border border-accent-200 px-5 py-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🏆</span>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-accent-900">모든 상황을 마스터했어요!</p>
          <p className="text-[12px] text-accent-700 mt-1 leading-relaxed">
            9가지 상황을 모두 확인한 보상으로 Video AI 크레딧 2개를 드릴게요
          </p>
          <button
            onClick={handleClaim}
            disabled={loading}
            className="mt-3 w-full rounded-xl py-2.5 bg-accent-500 text-white text-[13px] font-semibold active:bg-accent-600 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "처리 중…" : "크레딧 2개 받기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [claimResult, setClaimResult] = useState<{ remaining?: number } | null>(null);

  useEffect(() => {
    setDone(loadDone());
    setBonusClaimed(loadBonusClaimed());
    setMounted(true);
  }, []);

  function toggleDone(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveDone(next);
      return next;
    });
  }

  async function claimBonus() {
    const res = await fetch("/api/guide/claim-bonus", { method: "POST" });
    if (res.status === 409) {
      setBonusClaimed(true);
      saveBonusClaimed();
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error === "UNAUTHORIZED" ? "로그인이 필요합니다" : "서버 오류가 발생했습니다");
    }
    const data = await res.json();
    setClaimResult({ remaining: data.remaining });
    setBonusClaimed(true);
    saveBonusClaimed();
  }

  const doneCount = [...done].filter((id) => ALL_CARD_IDS.includes(id)).length;
  const allDone = doneCount === TOTAL;
  const pct = TOTAL > 0 ? Math.round((doneCount / TOTAL) * 100) : 0;

  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      <TopNav active="guide" />

      <main className="flex-1 w-full max-w-[1200px] mx-auto pb-24 md:pb-8">
        {/* Hero */}
        <div className="px-4 pt-7 pb-1 md:px-6">
          <p className="text-[11px] font-semibold tracking-widest text-accent-600 uppercase mb-1">Pilot</p>
          <h1 className="text-[22px] font-extrabold text-text-primary leading-tight">
            신입 유학생<br />생활 적응 가이드
          </h1>
          <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
            읽고 직접 해보면 확인 후 완료 표시 — 모두 완료하면 보상이 있어요
          </p>
        </div>

        {/* Progress */}
        {mounted && (
          <div className={`mx-4 md:mx-6 mt-5 rounded-2xl px-5 py-4 border transition-colors ${allDone ? "bg-accent-50 border-accent-200" : "bg-card border-line-neutral"}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className={`text-[13px] font-bold ${allDone ? "text-accent-800" : "text-text-primary"}`}>
                  {allDone ? "🎉 모든 상황을 마스터했어요!" : "나의 적응 진행률"}
                </p>
                {!allDone && <p className="text-[11px] text-text-tertiary mt-0.5">카드를 펼쳐 확인하고 완료 표시해보세요</p>}
              </div>
              <div className="text-right">
                <span className={`text-[22px] font-extrabold tabular-nums ${allDone ? "text-accent-700" : "text-text-primary"}`}>{doneCount}</span>
                <span className="text-[13px] text-text-tertiary">/{TOTAL}</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-accent-500" : "bg-accent-400"}`} style={{ width: `${pct}%` }} />
            </div>
            {doneCount > 0 && !allDone && <p className="mt-2 text-[11px] text-accent-600 font-medium">{pct}% 완료 — 잘하고 있어요!</p>}
          </div>
        )}

        {/* Category pills */}
        <div className="overflow-x-auto px-4 md:px-6 py-3">
          <div className="flex gap-2 w-max">
            {SECTIONS.map((s) => {
              const sectionDone = mounted ? s.cards.filter((c) => done.has(c.id)).length : 0;
              return (
                <a key={s.id} href={`#section-${s.id}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ${s.bgClass} ${s.textClass} whitespace-nowrap transition-opacity hover:opacity-80`}>
                  {s.label}
                  {mounted && sectionDone > 0 && (
                    <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${sectionDone === s.cards.length ? "bg-accent-500 text-white" : "bg-white/60"}`}>
                      {sectionDone}/{s.cards.length}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        <div className="px-4 md:px-6 pb-6 flex flex-col gap-8">
          {SECTIONS.map((section) => (
            <section key={section.id} id={`section-${section.id}`} className="scroll-mt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${section.bgClass} ${section.textClass}`}>{section.label}</span>
                <span className="text-[12px] text-text-disabled">{section.cards.length}개 상황</span>
              </div>
              <div className="flex flex-col gap-3">
                {section.cards.map((card) => (
                  <ActionCard key={card.id} card={card} done={done.has(card.id)} onDone={toggleDone} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Reward banner — only when all done */}
        {mounted && allDone && (
          <div className="pb-4">
            <CreditRewardBanner
              claimed={bonusClaimed || !!claimResult}
              onClaim={claimBonus}
            />
          </div>
        )}

        {/* Bottom CTA */}
        {!allDone && (
          <div className="mx-4 md:mx-6 mb-4 rounded-2xl bg-accent-50 border border-accent-100 px-5 py-4 text-center">
            <p className="text-[13px] font-semibold text-accent-800">더 많은 상황이 필요하신가요?</p>
            <p className="text-[12px] text-accent-700 mt-1">Video AI로 현지 생활 영상을 분석하면 나만의 행동카드를 만들 수 있어요</p>
          </div>
        )}
      </main>

      <BottomNav active="guide" />
    </div>
  );
}
