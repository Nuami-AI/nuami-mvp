import type { ResidenceHint } from "./types";

/**
 * Parse new residence hints from the user's situation text only.
 * Never use university affiliation or GPS as a substitute for this.
 */
const DISTRICT_PATTERN =
  /([가-힣]+(?:특별시|광역시|특별자치시|도)?\s*)?([가-힣]+(?:구|군|시))\b|(Geumjeong|Haeundae|Busanjin|Dongnae|Saha|Sasang|Nam-gu|Seo-gu|Jung-gu|Yeonje|Suyeong|Gijang|Gangseo|Gangnam|Mapo|Seodaemun|Yongsan|Jongno|Songpa|Gwanak|Guro|Yeongdeungpo)/gi;

const CITY_PATTERN =
  /(부산|서울|대구|인천|광주|대전|울산|세종|Busan|Seoul|Daegu|Incheon)/i;

const DONG_PATTERN = /([가-힣]+(?:동|읍|면))\b/;

function normalizeCity(raw: string): ResidenceHint["city"] {
  const t = raw.toLowerCase();
  if (/부산|busan/.test(t)) return "busan";
  if (/서울|seoul/.test(t)) return "seoul";
  if (/인천|incheon/.test(t)) return "incheon";
  if (/대구|daegu/.test(t)) return "daegu";
  return "other";
}

function toKoreanDistrict(raw: string): string {
  const map: Record<string, string> = {
    geumjeong: "금정구",
    haeundae: "해운대구",
    busanjin: "부산진구",
    dongnae: "동래구",
    saha: "사하구",
    sasang: "사상구",
    "nam-gu": "남구",
    "seo-gu": "서구",
    "jung-gu": "중구",
    yeonje: "연제구",
    suyeong: "수영구",
    gijang: "기장군",
    gangseo: "강서구",
    gangnam: "강남구",
    mapo: "마포구",
    seodaemun: "서대문구",
    yongsan: "용산구",
    jongno: "종로구",
    songpa: "송파구",
    gwanak: "관악구",
    guro: "구로구",
    yeongdeungpo: "영등포구",
  };
  const key = raw.toLowerCase();
  return map[key] ?? raw;
}

export function parseResidenceHint(situation: string): ResidenceHint | null {
  const text = situation.trim();
  if (!text) return null;

  let city: ResidenceHint["city"] | undefined;
  let district: string | undefined;
  let matchedText: string | undefined;

  const cityMatch = text.match(CITY_PATTERN);
  if (cityMatch?.[1]) {
    city = normalizeCity(cityMatch[1]);
    matchedText = cityMatch[1];
  }

  const districtMatches = [...text.matchAll(DISTRICT_PATTERN)];
  for (const m of districtMatches) {
    const koreanDistrict = m[2];
    const latinDistrict = m[3];
    if (koreanDistrict) {
      // Avoid treating "부산광역시" fragments wrongly; keep *구/*군/*시
      if (/광역시|특별시|특별자치시|도$/.test(koreanDistrict)) continue;
      district = koreanDistrict;
      matchedText = m[0].trim();
      if (m[1]) city = normalizeCity(m[1]);
      break;
    }
    if (latinDistrict) {
      district = toKoreanDistrict(latinDistrict);
      matchedText = latinDistrict;
      break;
    }
  }

  // "부산 금정" without 구
  if (!district) {
    const loose = text.match(/(부산|서울|대구|인천)\s*([가-힣]{1,4})(?!\s*(대|대학|학교))/);
    if (loose?.[2] && !/기숙사|원룸|방|집/.test(loose[2])) {
      const cand = loose[2];
      if (/구$|군$|시$/.test(cand) || cand.length >= 2) {
        district = /구$|군$|시$/.test(cand) ? cand : `${cand}구`;
        city = normalizeCity(loose[1]);
        matchedText = loose[0];
      }
    }
  }

  const dong = text.match(DONG_PATTERN)?.[1];
  if (dong && !district) {
    matchedText = matchedText ? `${matchedText} ${dong}` : dong;
  }

  if (!city && !district && !dong) return null;

  const enoughForJurisdiction = Boolean(district) || Boolean(city && dong);
  return {
    city,
    district,
    matchedText: matchedText ?? dong,
    enoughForJurisdiction,
  };
}

export const NEED_ADDRESS_PROMPT_KO =
  "체류지 변경 신고가 필요할 수 있어요. 정확한 관할기관을 찾으려면 새로 이사한 주소나 지역을 알려주세요.";
