import type { ResultVenue } from "./venue-context";

export function getEncouragementMessage(situation: string, venue: ResultVenue): string {
  const s = situation.toLowerCase();

  if (/병원|약국|아프|감기|열|통증|hospital|clinic|pharmacy/.test(s) || venue === "hospital") {
    return "아프면 몸은 많이 괜찮나요? 무리하지 말고 천천히 회복하길 바라요 🩺";
  }
  if (/쇼핑|올리브|올영|할인|매장|뷰티|화장/.test(s) || venue === "store") {
    return "오! 좋은 물건들 꼭 사길 바래요. 오늘 쇼핑 즐겁게! 🛍️";
  }
  if (/은행|계좌|송금|bank/.test(s) || venue === "bank") {
    return "서류만 준비하면 차근차근 할 수 있어요. 응원할게요 💳";
  }
  if (/체류지|전입|이사|주소/.test(s) || venue === "immigration") {
    return "전입한 날부터 15일이에요. 서류만 챙기면 순서대로 끝낼 수 있어요 🏠";
  }
  if (/학교|수업|교수|등록|학점|campus|university/.test(s)) {
    return "새 학기, 잘 해낼 수 있어요. 하나씩만 챙기면 돼요 🎓";
  }
  if (/지하철|버스|교통|택시|subway|transport/.test(s)) {
    return "처음엔 헷갈려도 금방 익숙해져요. 오늘도 잘 다녀올 거예요 🚇";
  }
  if (/집|월세|전세|계약|주거|dorm|rent/.test(s)) {
    return "낯선 집이 곧 편한 공간이 될 거예요. 차분히 준비해요 🏠";
  }
  if (/음식|배달|식당|마트|food|delivery/.test(s)) {
    return "맛있는 한 끼, 잘 찾아보세요! 배고프면 힘들잖아요 🍜";
  }
  return "처음이라 막막할 수 있어요. 아래 순서대로만 따라가면 돼요 ✨";
}

export function summarizeSituationQuery(text: string, maxLen = 18): string {
  const s = text.trim();
  if (!s) return "생활 가이드";
  if (s.length <= maxLen) return s;

  const lower = s.toLowerCase();
  if (/병원|아프|머리|감기|열|통증|약/.test(s) || /hospital|clinic|headache/.test(lower)) {
    return "병원 방문";
  }
  if (/올리브|쇼핑|할인|매장|뷰티/.test(s) || /shopping|olive/.test(lower)) return "쇼핑·할인";
  if (/은행|계좌|송금/.test(s) || /bank/.test(lower)) return "은행 업무";
  if (/학교|수업|교수|등록/.test(s) || /university|campus/.test(lower)) return "학교·수업";
  if (/지하철|버스|교통|택시/.test(s) || /subway|transport/.test(lower)) return "교통 이용";
  if (/집|월세|전세|계약/.test(s) || /rent|dorm/.test(lower)) return "주거·계약";
  if (/음식|배달|식당|마트/.test(s) || /food|delivery/.test(lower)) return "음식·장보기";

  const first = (s.split(/[.!?。,\n]/)[0] ?? s).trim();
  if (first.length <= maxLen) return first;
  return `${first.slice(0, maxLen - 1)}…`;
}

export function summarizeToBullets(text: string, max = 3): string[] {
  const parts = text
    .split(/[.!?。\n]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 4);
  if (parts.length === 0) return [text.slice(0, 60)];
  return parts.slice(0, max).map((p) => (p.length > 48 ? `${p.slice(0, 48)}…` : p));
}
