/**
 * 대한민국 광역지방자치단체 (지방자치법 기준).
 * 탭·필터는 관용 약칭, title에는 공식 명칭을 둡니다.
 * InstitutionSeed.city 는 약칭(서울/부산 등)과 맞춥니다.
 */
export interface RegionDivision {
  /** 필터·카탈로그 city 키 */
  id: string;
  /** UI 표시용 약칭 */
  label: string;
  /** 공식 명칭 */
  officialName: string;
}

export const REGION_DIVISIONS: RegionDivision[] = [
  { id: "서울", label: "서울", officialName: "서울특별시" },
  { id: "부산", label: "부산", officialName: "부산광역시" },
  { id: "대구", label: "대구", officialName: "대구광역시" },
  { id: "인천", label: "인천", officialName: "인천광역시" },
  { id: "광주", label: "광주", officialName: "광주광역시" },
  { id: "대전", label: "대전", officialName: "대전광역시" },
  { id: "울산", label: "울산", officialName: "울산광역시" },
  { id: "세종", label: "세종", officialName: "세종특별자치시" },
  { id: "경기", label: "경기", officialName: "경기도" },
  { id: "강원", label: "강원", officialName: "강원특별자치도" },
  { id: "충북", label: "충북", officialName: "충청북도" },
  { id: "충남", label: "충남", officialName: "충청남도" },
  { id: "전북", label: "전북", officialName: "전북특별자치도" },
  { id: "전남", label: "전남", officialName: "전라남도" },
  { id: "경북", label: "경북", officialName: "경상북도" },
  { id: "경남", label: "경남", officialName: "경상남도" },
  { id: "제주", label: "제주", officialName: "제주특별자치도" },
];

const ALIASES: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  세종시: "세종",
  경기도: "경기",
  강원도: "강원",
  강원특별자치도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전라북도: "전북",
  전북특별자치도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주도: "제주",
  제주특별자치도: "제주",
};

export function normalizeRegionId(city: string): string {
  const trimmed = city.trim();
  if (!trimmed) return "";
  if (REGION_DIVISIONS.some((r) => r.id === trimmed)) return trimmed;
  return ALIASES[trimmed] ?? trimmed;
}

export function regionOf(city: string): RegionDivision | undefined {
  const id = normalizeRegionId(city);
  return REGION_DIVISIONS.find((r) => r.id === id);
}
