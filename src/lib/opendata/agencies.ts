import { searchKakaoPlaces } from "@/lib/kakao/search";
import { cityQueryLabel, isPhysicalPlaceName, type CityRegion, type UserCoords } from "@/lib/geo/region";
import type { PublicFacility } from "./types";

const SEOUL_IMMIGRATION: PublicFacility[] = [
  {
    name: "서울출입국·외국인청",
    address: "서울특별시 양천구 목동동로 151",
    phone: "1345",
    category: "출입국·외국인청",
    provider: "법무부 출입국·외국인정책본부",
    dataset: "소속기관 안내",
    datasetUrl: "https://www.immigration.go.kr",
    live: false,
  },
  {
    name: "서울남부출입국·외국인사무소",
    address: "서울특별시 강서구 마곡서1로 48",
    phone: "1345",
    category: "출입국·외국인사무소",
    provider: "법무부 출입국·외국인정책본부",
    dataset: "소속기관 안내",
    datasetUrl: "https://www.immigration.go.kr",
    live: false,
  },
];

const BUSAN_IMMIGRATION: PublicFacility[] = [
  {
    name: "부산출입국·외국인청",
    address: "부산광역시 강서구 대저로 251",
    phone: "1345",
    category: "출입국·외국인청",
    provider: "법무부 출입국·외국인정책본부",
    dataset: "소속기관 안내",
    datasetUrl: "https://www.immigration.go.kr",
    live: false,
  },
];

function officialImmigration(region: CityRegion): PublicFacility[] {
  if (region === "busan") return BUSAN_IMMIGRATION;
  return SEOUL_IMMIGRATION;
}

function toFacility(place: {
  placeName: string;
  address: string;
  roadAddress: string;
  phone: string;
  lat: number;
  lng: number;
  category?: string;
}): PublicFacility {
  return {
    name: place.placeName,
    address: place.roadAddress || place.address,
    phone: place.phone,
    lat: place.lat,
    lng: place.lng,
    category: place.category || "출입국·외국인청",
    provider: "법무부 + 카카오 위치정보",
    dataset: "소속기관 안내 / 지도 API",
    datasetUrl: "https://www.immigration.go.kr",
    live: true,
  };
}

export async function fetchNearbyImmigration(
  coords?: UserCoords,
  region: CityRegion = "other",
): Promise<{ facilities: PublicFacility[]; error?: string }> {
  if (!coords) {
    return { facilities: officialImmigration(region) };
  }

  const kakao = await searchKakaoPlaces("출입국외국인청", 6, { ...coords, radius: 20000 });
  const live = kakao.places
    .map(toFacility)
    .filter((row) => isPhysicalPlaceName(row.name, row.address));

  if (live.length > 0) return { facilities: live.slice(0, 5) };
  return { facilities: officialImmigration(region), error: kakao.error };
}

export async function fetchNearbyBanks(
  coords?: UserCoords,
  region: CityRegion = "other",
): Promise<{ facilities: PublicFacility[]; error?: string }> {
  const city = cityQueryLabel(region);
  const query = coords ? "은행" : city ? `${city} 은행` : "은행";
  const kakao = await searchKakaoPlaces(query, 6, coords ? { ...coords, radius: 20000 } : undefined);
  const facilities = kakao.places.map((place) => ({
    name: place.placeName,
    address: place.roadAddress || place.address,
    phone: place.phone,
    lat: place.lat,
    lng: place.lng,
    category: place.category || "은행",
    provider: "위치정보 API",
    dataset: "지도/주소 Open API",
    live: true,
  } satisfies PublicFacility));

  if (facilities.length > 0) return { facilities: facilities.slice(0, 5) };
  return { facilities: [], error: kakao.error };
}
