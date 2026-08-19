export type CityRegion = "seoul" | "busan" | "incheon" | "daegu" | "gyeonggi" | "other";

export interface UserCoords {
  lat: number;
  lng: number;
}

export function regionFromCoords(lat: number, lng: number): CityRegion {
  if (lat >= 37.41 && lat <= 37.72 && lng >= 126.78 && lng <= 127.22) return "seoul";
  if (lat >= 37.28 && lat <= 37.58 && lng >= 126.38 && lng <= 126.78) return "incheon";
  if (lat >= 37.0 && lat <= 38.3 && lng >= 126.5 && lng <= 127.9) return "gyeonggi";
  if (lat >= 35.02 && lat <= 35.40 && lng >= 128.82 && lng <= 129.32) return "busan";
  if (lat >= 35.70 && lat <= 36.05 && lng >= 128.40 && lng <= 128.80) return "daegu";
  return "other";
}

export function cityQueryLabel(region: CityRegion): string {
  switch (region) {
    case "seoul":
      return "서울";
    case "busan":
      return "부산";
    case "incheon":
      return "인천";
    case "daegu":
      return "대구";
    case "gyeonggi":
      return "경기";
    default:
      return "";
  }
}

export function hiraSidoCd(region: CityRegion): string | undefined {
  switch (region) {
    case "seoul":
      return "110000";
    case "busan":
      return "210000";
    case "incheon":
      return "230000";
    case "daegu":
      return "220000";
    case "gyeonggi":
      return "310000";
    default:
      return undefined;
  }
}

export function pharmacySidoName(region: CityRegion): string | undefined {
  switch (region) {
    case "seoul":
      return "서울특별시";
    case "busan":
      return "부산광역시";
    case "incheon":
      return "인천광역시";
    case "daegu":
      return "대구광역시";
    case "gyeonggi":
      return "경기도";
    default:
      return undefined;
  }
}

export function isPhysicalPlaceName(name: string, address?: string): boolean {
  const text = `${name} ${address ?? ""}`;
  return !/하이코리아|전자민원|온라인 신청|hikorea/i.test(text);
}
