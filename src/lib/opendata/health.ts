import { searchKakaoPlaces } from "@/lib/kakao/search";
import {
  cityQueryLabel,
  hiraSidoCd,
  pharmacySidoName,
  type CityRegion,
  type UserCoords,
} from "@/lib/geo/region";
import { fetchDataGoKr } from "./client";
import type { PublicFacility } from "./types";

const HIRA_LIST = "https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList";
const PHARMACY_LIST = "https://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire";

function toHospital(item: Record<string, string>, live: boolean): PublicFacility | null {
  const name = item.yadmNm ?? item.dutyName;
  if (!name) return null;
  return {
    name,
    address: item.addr ?? item.dutyAddr,
    phone: item.telno ?? item.dutyTel1,
    lat: item.YPos ? Number(item.YPos) : undefined,
    lng: item.XPos ? Number(item.XPos) : undefined,
    category: item.clCdNm ?? "병원",
    provider: "건강보험심사평가원",
    dataset: "병원정보서비스",
    datasetUrl: "https://www.data.go.kr/data/15001698/openapi.do",
    live,
  };
}

function toPharmacy(item: Record<string, string>, live: boolean): PublicFacility | null {
  const name = item.dutyName ?? item.yadmNm;
  if (!name) return null;
  return {
    name,
    address: item.dutyAddr ?? item.addr,
    phone: item.dutyTel1 ?? item.telno,
    lat: item.wgs84Lat ? Number(item.wgs84Lat) : undefined,
    lng: item.wgs84Lon ? Number(item.wgs84Lon) : undefined,
    category: "약국",
    provider: "국립중앙의료원",
    dataset: "전국 약국 정보 조회 서비스",
    datasetUrl: "https://www.data.go.kr/data/15000576/openapi.do",
    live,
  };
}

async function kakaoNearby(
  query: string,
  category: string,
  coords?: UserCoords,
  provider = "위치정보 API",
  dataset = "지도/주소 Open API",
  datasetUrl?: string,
): Promise<PublicFacility[]> {
  const kakao = await searchKakaoPlaces(query, 5, coords ? { ...coords, radius: 20000 } : undefined);
  return kakao.places.map((place) => ({
    name: place.placeName,
    address: place.roadAddress || place.address,
    phone: place.phone,
    lat: place.lat,
    lng: place.lng,
    category,
    provider,
    dataset,
    datasetUrl,
    live: true,
  }));
}

export async function fetchNearbyHospitals(
  coords?: UserCoords,
  region: CityRegion = "other",
): Promise<{ facilities: PublicFacility[]; error?: string }> {
  const sidoCd = hiraSidoCd(region);
  const params: Record<string, string> = { pageNo: "1", numOfRows: "8" };
  if (sidoCd) params.sidoCd = sidoCd;
  if (coords) {
    params.xPos = String(coords.lng);
    params.yPos = String(coords.lat);
    params.radius = "3000";
  }

  const { items, error } = await fetchDataGoKr(HIRA_LIST, params);
  const facilities = items.map((item) => toHospital(item, true)).filter((row): row is PublicFacility => Boolean(row));
  if (facilities.length > 0) return { facilities: facilities.slice(0, 5) };

  const city = cityQueryLabel(region);
  const kakao = await kakaoNearby(
    coords ? "종합병원" : city ? `${city} 종합병원` : "종합병원",
    "병원",
    coords,
    "건강보험심사평가원 데이터셋 + 위치정보 API",
    "병원정보서비스 / 지도 위치 확인",
    "https://www.data.go.kr/data/15001698/openapi.do",
  );
  return { facilities: kakao.slice(0, 5), error };
}

export async function fetchNearbyPharmacies(
  coords?: UserCoords,
  region: CityRegion = "other",
): Promise<{ facilities: PublicFacility[]; error?: string }> {
  const q0 = pharmacySidoName(region);
  const params: Record<string, string> = { pageNo: "1", numOfRows: "5" };
  if (q0) params.Q0 = q0;

  const { items, error } = await fetchDataGoKr(PHARMACY_LIST, params);
  const facilities = items.map((item) => toPharmacy(item, true)).filter((row): row is PublicFacility => Boolean(row));
  if (facilities.length > 0) return { facilities: facilities.slice(0, 3) };

  const city = cityQueryLabel(region);
  const kakao = await kakaoNearby(
    coords ? "약국" : city ? `${city} 약국` : "약국",
    "약국",
    coords,
    "국립중앙의료원 데이터셋 + 위치정보 API",
    "전국 약국 정보 / 지도 위치 확인",
    "https://www.data.go.kr/data/15000576/openapi.do",
  );
  return { facilities: kakao.slice(0, 3), error };
}
