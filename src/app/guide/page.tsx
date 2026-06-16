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
  {
    id: "shopping",
    label: "오프라인 쇼핑",
    bgClass: "bg-pink-100",
    textClass: "text-pink-700",
    cards: [
      {
        id: "olive-sale-intro",
        emoji: "🛍️",
        title: "올영세일, 처음부터 알아두기",
        situation: "매년 3·6·9·12월 초 올리브영 핫 세일(올영세일) 시즌 — 친구들이 '올영에서 뭐 살 거야?'라고 물을 때",
        steps: [
          "올영 = 올리브영 줄임말, K-뷰티 제품이 모여 있는 대형 드럭스토어",
          "핫 세일은 연 4회(3·6·9·12월 초) — 이때 할인 폭이 가장 큼",
          "친구들과 함께 가기 전, 사고 싶은 카테고리(립·베이스·스킨케어) 1~3개만 정해두기",
          "올리브영 앱에서 미리 위시리스트·쿠폰·멤버십 상태를 확인해 두기",
        ],
        tip: "한국 오프라인 매장은 온라인과 달리 직접 테스트하고 직원에게 도움을 요청하는 문화가 자연스러워요. 방문 전에 아래 카드들을 미리 읽어두면 훨씬 편합니다.",
        verification: "quiz",
        quiz: {
          question: "한국인 친구들이 말하는 '올영'은 무엇을 뜻할까요?",
          options: ["온라인 영상 플랫폼", "올리브영", "올리브 오일 브랜드", "온라인 쇼핑몰"],
          answerIndex: 1,
        },
      },
      {
        id: "olive-store-culture",
        emoji: "🏪",
        title: "한국 매장 문화 — 직원 호출·품절 이해하기",
        situation: "매대에 제품이 없을 때 품절인지 모르겠고, 직원을 불러도 되는지 망설여질 때",
        steps: [
          "한국 드럭스토어·대형매장에서는 '직원님, 도와주세요'라고 불러도 전혀 무례하지 않아요 — 오히려 재고 확인·제품 꺼내기를 기대합니다",
          "매대에 없다고 해서 곧바로 품절은 아님 — 창고 재고, 다른 코너 진열, 온라인 전용 구성 등 이유로 안 보일 수 있어요",
          "품절 여부는 가격표 옆 '품절' 스티커 또는 직원에게 '이 제품 있나요?'로 확인하는 게 확실합니다",
          "올리브영처럼 프랜차이즈 매장은 '다른 매장 재고'도 앱이나 직원에게 문의할 수 있어요",
          "여러 제품을 찾을 때 직원을 여러 번 불러도 괜찮습니다 — 한국에서는 흔한 이용 방식이에요",
        ],
        tip: "서양 문화와 달리 한국 매장은 '혼자 끝까지 찾기'보다 '직원에게 바로 물어보기'가 더 빠르고 자연스러운 경우가 많아요.",
        verification: "quiz",
        quiz: {
          question: "매대에 원하는 제품이 없을 때, 한국 매장 문화에 맞는 행동은?",
          options: [
            "품절이라고 생각하고 바로 나가기",
            "직원에게 재고·위치 확인 요청하기",
            "다른 브랜드 매장으로만 이동하기",
            "조용히 기다리기만 하기",
          ],
          answerIndex: 1,
        },
      },
      {
        id: "olive-store",
        emoji: "💄",
        title: "매장에서 제품 찾고 테스트하기",
        situation: "친구 따라 올리브영에 왔는데 제품이 너무 많고, 웜/쿨 베스트 태그가 헷갈릴 때",
        steps: [
          "립·치크 제품의 '웜 베스트 / 쿨 베스트' 태그는 퍼스널컬러에 맞는 인기 제품 추천",
          "매대 깊숙이 있거나 전시 샘플만 있는 경우 — '이 제품을 꺼내줄 수 있나요?'",
          "이 매장에 없으면 — '이 제품이 다른 매장에 있나요?' 또는 '근처 다른 올리브영에 재고 있나요?'",
          "테스트존에서 '테스트 해봐도 되나요?'라고 물어보고 손등·입술에 발색 확인",
        ],
        phrases: [
          { native: "이 제품을 꺼내줄 수 있나요?", meaning: "매대 안쪽·창고 재고 꺼내달라고 요청" },
          { native: "이 제품이 다른 매장에 있나요?", meaning: "다른 지점 재고 확인" },
          { native: "근처 다른 올리브영에 재고 있나요?", meaning: "프랜차이즈 타 매장 재고 문의" },
          { native: "직원님, 도와주세요", meaning: "직원 호출 (한국 매장에서 자연스러움)" },
          { native: "테스트 해봐도 되나요?", meaning: "시향·발색 테스트 요청" },
        ],
        tip: "분홍색을 좋아한다고 해서 웜/쿨이 정해지지 않아요. 태그는 참고용이고, 직접 테스트하는 게 가장 확실합니다.",
        verification: "quiz",
        quiz: {
          question: "프랜차이즈 매장에서 타 지점 재고를 물어볼 때 자연스러운 표현은?",
          options: [
            "이 제품은 얼마인가요?",
            "이 제품이 다른 매장에 있나요?",
            "계산해 주세요",
            "포장해 주세요",
          ],
          answerIndex: 1,
        },
      },
      {
        id: "olive-discount",
        emoji: "💳",
        title: "오프라인 결제 할인 — 미리 알아두기",
        situation: "세일 기간에 왔는데 회원할인·쿠폰·카드 할인 조건이 겹쳐서 실제 혜택이 헷갈릴 때",
        steps: [
          "① 세일가(올영세일 기본 할인) → ② 올리브영 멤버십(CJ ONE 연동) → ③ 앱 쿠폰 → ④ 제휴카드/간편결제 프로모션 순으로 확인",
          "올리브영 앱 가입 후 '쿠폰함'·'멤버십' 탭에서 받을 수 있는 할인을 방문 전에 미리 다운로드",
          "제휴카드(삼성·KB·신한 등)는 시즌마다 달라요 — 세일 기간 '올리브영 카드 할인' 공지를 앱·매장 POP에서 확인",
          "카운터에서 결제 전 '회원 할인·쿠폰·카드 할인 중 뭐가 적용되나요?'라고 물어보면 최종 금액을 정확히 알 수 있어요",
          "일부 혜택은 앱 전용·온라인 전용이라 오프라인만으로는 전부 받기 어려울 수 있음 — 방문 전 체크 필수",
        ],
        phrases: [
          { native: "회원 할인 되나요?", meaning: "멤버십 할인 적용 여부" },
          { native: "쿠폰 사용할 수 있나요?", meaning: "앱 쿠폰 적용 확인" },
          { native: "제휴카드 할인 되나요?", meaning: "카드사 프로모션 확인" },
          { native: "할인 다 적용하면 얼마예요?", meaning: "최종 결제 금액 확인" },
        ],
        tip: "세일 기간에 왔는데 할인을 못 받는 것처럼 느껴지면, 대부분 멤버십·쿠폰·카드 조건을 몰라서예요. 결제 직전에 한 번 더 확인하세요.",
        verification: "timer",
        timerSec: 25,
      },
      {
        id: "korea-beauty-trend",
        emoji: "🇰🇷",
        title: "지금 한국의 트렌드는?",
        situation: "화장품·뷰티 제품을 고를 때 — 쿨톤/웜톤, 글로시/매트 제형, 아이돌 메이크업 유행이 헷갈릴 때",
        steps: [
          "한국 뷰티는 나노 단위로 세분화 — 톤(쿨/웜), 제형(글로시/매트), 피부타입, 퍼스널컬러까지 따져요",
          "매장 '웜 베스트 / 쿨 베스트' 태그는 퍼스널컬러 힌트 — 좋아하는 색과는 다를 수 있어요",
          "시즌마다 글로시(광택) ↔ 매트(보송) 중 하나가 더 뜨는 경우가 많아요",
          "아이돌·연예인 메이크업을 보면 지금 한국에서 유행하는 색감·제형을 가장 빠르게 알 수 있어요",
          "뉴아미 동영상 링크 요약(/guide/video-links)으로 유행 영상을 정리하고, 매장 가기 전 후보 3개만 골라두세요",
        ],
        tip: "유행에 맞는 사진·영상을 한 번 확인하고 가면, 매장에서 헤매는 시간이 확 줄어요.",
        verification: "quiz",
        quiz: {
          question: "한국 K-뷰티에서 지금 유행을 가장 빠르게 읽는 방법은?",
          options: [
            "가격이 가장 비싼 제품 고르기",
            "아이돌·뷰티 유튜버 메이크업 영상 참고",
            "매장에서 아무거나 집기",
            "온라인 리뷰만 영어로 검색",
          ],
          answerIndex: 1,
        },
      },
      {
        id: "olive-purchase",
        emoji: "📱",
        title: "온·오프라인 함께 쓰는 구매 전략",
        situation: "매장에서 할인을 못 받은 것 같고, 집에서 온라인으로 사려니 품절일 때",
        steps: [
          "온라인 품절이면 오프라인 매장 재고만 남은 경우가 많음 — 앱 '매장 재고' 기능으로 주변 지점 확인",
          "뉴아미 행동가이드로 방문 전 구매 목록·할인 체크리스트를 정리해 두기",
          "유학생도 멤버십·앱 쿠폰은 대부분 가입 가능 — 여권·외국인등록증으로 가입 방법 확인",
          "다음 세일까지 기다릴 때도 위시리스트 + 알림 설정으로 재입고·쿠폰을 놓치지 않기",
        ],
        tip: "결국 세일 혜택을 못 받는 이유는 '매장 문화·할인 구조·뷰티 정보'를 한꺼번에 모르기 때문이에요. 방문 전에 이 탭 카드들을 순서대로 읽어두면 훨씬 수월합니다.",
        verification: "timer",
        timerSec: 20,
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
            {TOTAL}가지 상황을 모두 확인한 보상으로 Video AI 크레딧 2개를 드릴게요
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
