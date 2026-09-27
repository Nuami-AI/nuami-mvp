import { searchKakaoPlaces } from "@/lib/kakao/search";
import { isPhysicalPlaceName, type UserCoords } from "@/lib/geo/region";
import { haversineMeters } from "@/lib/geo/distance";
import {
  isCivilImmigrationOffice,
  isImmigrationCheckpoint,
  isLikelyCommunityCenter,
  isLikelyDistrictOffice,
} from "./filters";
import { NEED_ADDRESS_PROMPT_KO, parseResidenceHint } from "./parse-residence";
import type { RecommendedPlace, ResidenceHint } from "./types";

const AS_OF = "2026-08";
const IMMIGRATION_SOURCE = {
  provider: "법무부 출입국·외국인정책본부",
  dataset: "소속기관 안내",
  datasetUrl: "https://www.immigration.go.kr",
  asOf: AS_OF,
};

const ADMIN_SOURCE = {
  provider: "행정안전부 / 지자체 + 카카오 위치정보",
  dataset: "민원시설 검색",
  datasetUrl: "https://www.data.go.kr",
  asOf: AS_OF,
};

/**
 * Official civil immigration offices that handle stay/residence filings.
 * Never include airport/port checkpoints. Prefer the window that handles 체류.
 * Source: immigration.go.kr 관할구역안내 (asOf AS_OF).
 */
const CIVIL_IMMIGRATION: Record<
  string,
  Array<{ name: string; address: string; phone: string; lat?: number; lng?: number; note?: string }>
> = {
  busan: [
    {
      name: "부산출입국·외국인청 별관",
      address: "부산광역시 중구 충장대로 7 (교보생명 중앙동사옥)",
      phone: "1345",
      lat: 35.1038,
      lng: 129.0364,
      note: "체류·사증 민원 (본관은 선박·조사 등 — 체류지 변경은 별관)",
    },
  ],
  seoul: [
    {
      name: "서울출입국·외국인청",
      address: "서울특별시 양천구 목동동로 151",
      phone: "1345",
      lat: 37.5219,
      lng: 126.8631,
    },
    {
      name: "서울남부출입국·외국인사무소",
      address: "서울특별시 강서구 마곡서1로 48",
      phone: "1345",
      lat: 37.5665,
      lng: 126.8275,
    },
  ],
};

function areaLabel(hint: ResidenceHint): string {
  const parts = [hint.city === "busan" ? "부산" : hint.city === "seoul" ? "서울" : "", hint.district]
    .filter(Boolean)
    .join(" ");
  return parts || hint.matchedText || "";
}

function roleOf(name: string, category?: string): RecommendedPlace["role"] {
  if (isLikelyCommunityCenter(name, category)) return "community-center";
  if (isLikelyDistrictOffice(name, category)) return "district-office";
  if (isCivilImmigrationOffice(name, undefined, category)) return "immigration-civil";
  return "other";
}

function tasksForRole(role: RecommendedPlace["role"]): string[] {
  if (role === "community-center") {
    return ["관할 행정복지센터 민원 안내", "전입·거주 관련 지자체 창구 확인"];
  }
  if (role === "district-office") {
    return ["시·군·구청 민원", "관할 행정 안내"];
  }
  if (role === "immigration-civil") {
    return ["외국인 체류지 변경 신고", "체류 민원 창구"];
  }
  return [];
}

function sortPlaces(places: RecommendedPlace[]): RecommendedPlace[] {
  const roleRank: Record<RecommendedPlace["role"], number> = {
    "community-center": 0,
    "district-office": 1,
    "immigration-civil": 2,
    other: 3,
  };
  return [...places].sort((a, b) => {
    if (a.canHandleTask !== b.canHandleTask) return a.canHandleTask ? -1 : 1;
    if (a.jurisdictionMatch !== b.jurisdictionMatch) return a.jurisdictionMatch ? -1 : 1;
    if (roleRank[a.role] !== roleRank[b.role]) return roleRank[a.role] - roleRank[b.role];
    const da = a.distanceMeters ?? Number.POSITIVE_INFINITY;
    const db = b.distanceMeters ?? Number.POSITIVE_INFINITY;
    return da - db;
  });
}

/** Prefer in-district facilities when filling each role bucket. */
function roleBucket(places: RecommendedPlace[]): Record<RecommendedPlace["role"], RecommendedPlace[]> {
  const sorted = sortPlaces(places);
  const byRole: Record<RecommendedPlace["role"], RecommendedPlace[]> = {
    "community-center": [],
    "district-office": [],
    "immigration-civil": [],
    other: [],
  };
  for (const p of sorted) byRole[p.role].push(p);
  return byRole;
}

async function searchAreaFacilities(
  hint: ResidenceHint,
): Promise<{ places: RecommendedPlace[]; error?: string }> {
  const area = areaLabel(hint);
  if (!area) return { places: [] };

  const queries = [
    `${area} 행정복지센터`,
    `${area} 주민센터`,
    hint.district ? `${hint.district.replace(/구$/, "")}구청` : `${area} 구청`,
  ];

  const seen = new Set<string>();
  const places: RecommendedPlace[] = [];
  let error: string | undefined;

  for (const query of queries) {
    const kakao = await searchKakaoPlaces(query, 8);
    if (kakao.error && !error) error = kakao.error;
    for (const place of kakao.places) {
      if (seen.has(place.id)) continue;
      if (!isPhysicalPlaceName(place.placeName, place.roadAddress || place.address)) continue;
      if (isImmigrationCheckpoint(place.placeName, place.roadAddress || place.address, place.category)) {
        continue;
      }
      const name = place.placeName;
      const category = place.category;
      const role = roleOf(name, category);
      if (role === "other" && !isLikelyCommunityCenter(name, category) && !isLikelyDistrictOffice(name, category)) {
        continue;
      }
      // Prefer the main office over kiosk-only entries when both exist
      if (/무인민원발급/.test(name) && !/행정복지센터$|주민센터$/.test(name)) continue;
      seen.add(place.id);
      const address = place.roadAddress || place.address;
      const inDistrict =
        !hint.district ||
        address.includes(hint.district) ||
        name.includes(hint.district.replace(/구$/, ""));
      places.push({
        id: place.id,
        name,
        address,
        phone: place.phone || undefined,
        lat: place.lat,
        lng: place.lng,
        category,
        processableTasks: tasksForRole(role === "other" ? "community-center" : role),
        role: role === "other" ? "community-center" : role,
        jurisdictionMatch: inDistrict,
        canHandleTask: true,
        distanceMeters: place.distanceMeters,
        hours: undefined,
        provider: ADMIN_SOURCE.provider,
        dataset: ADMIN_SOURCE.dataset,
        datasetUrl: ADMIN_SOURCE.datasetUrl,
        asOf: ADMIN_SOURCE.asOf,
        live: true,
        placeUrl: place.placeUrl,
      });
    }
  }

  return { places, error };
}

function civilImmigrationForHint(
  hint: ResidenceHint,
  userCoords?: UserCoords,
): RecommendedPlace[] {
  const busanDistricts = /금정|해운대|부산진|동래|사하|사상|남구|서구|중구|연제|수영|기장|강서|영도/;
  const seoulDistricts = /강남|마포|서대문|용산|종로|송파|관악|구로|영등포|양천|강서|중구|성동|광진/;

  let rows = CIVIL_IMMIGRATION.busan;
  if (hint.city === "seoul" || (hint.district && seoulDistricts.test(hint.district))) {
    rows = CIVIL_IMMIGRATION.seoul;
  } else if (hint.city === "busan" || (hint.district && busanDistricts.test(hint.district))) {
    rows = CIVIL_IMMIGRATION.busan;
  }

  return rows.map((row, idx) => {
    const distanceMeters =
      userCoords && row.lat != null && row.lng != null
        ? haversineMeters(userCoords.lat, userCoords.lng, row.lat, row.lng)
        : undefined;
    const tasks = tasksForRole("immigration-civil");
    if (row.note) tasks.unshift(row.note);
    return {
      id: `civil-immigration-${hint.city ?? "kr"}-${idx}`,
      name: row.name,
      address: row.address,
      phone: row.phone,
      lat: row.lat,
      lng: row.lng,
      category: "출입국·외국인청",
      processableTasks: tasks,
      role: "immigration-civil" as const,
      jurisdictionMatch: true,
      canHandleTask: true,
      distanceMeters,
      hours: "평일 09:00–18:00 (기관별 상이 · 1345 확인)",
      provider: IMMIGRATION_SOURCE.provider,
      dataset: IMMIGRATION_SOURCE.dataset,
      datasetUrl: IMMIGRATION_SOURCE.datasetUrl,
      asOf: IMMIGRATION_SOURCE.asOf,
      live: false,
    };
  });
}

/** Keep role diversity so community centers do not crowd out 구청 / 출입국. */
function pickBalancedPlaces(places: RecommendedPlace[], limit = 8): RecommendedPlace[] {
  const sorted = sortPlaces(places);
  const byRole = roleBucket(places);
  const picked: RecommendedPlace[] = [];
  const take = (role: RecommendedPlace["role"], n: number) => {
    for (const p of byRole[role].splice(0, n)) {
      if (picked.length >= limit) return;
      picked.push(p);
    }
  };

  take("immigration-civil", 1);
  take("district-office", 1);
  take("community-center", 4);
  take("immigration-civil", 1);
  take("district-office", 1);
  take("community-center", 2);
  take("other", 2);

  for (const p of sorted) {
    if (picked.length >= limit) break;
    if (!picked.some((x) => x.id === p.id)) picked.push(p);
  }

  return sortPlaces(picked);
}

function nearestCivilImmigration(userCoords?: UserCoords): RecommendedPlace[] {
  if (!userCoords) return [];
  const all = [
    ...CIVIL_IMMIGRATION.busan.map((row, idx) => ({ row, city: "busan", idx })),
    ...CIVIL_IMMIGRATION.seoul.map((row, idx) => ({ row, city: "seoul", idx })),
  ];
  const ranked = all
    .map(({ row, city, idx }) => {
      const distanceMeters =
        row.lat != null && row.lng != null
          ? haversineMeters(userCoords.lat, userCoords.lng, row.lat, row.lng)
          : Number.POSITIVE_INFINITY;
      return { row, city, idx, distanceMeters };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  const best = ranked[0];
  if (!best || !Number.isFinite(best.distanceMeters)) return [];
  // Only attach if within ~80km so we don't show Seoul office to Busan GPS accidentally as "near"
  if (best.distanceMeters > 80_000) return [];

  const tasks = tasksForRole("immigration-civil");
  if (best.row.note) tasks.unshift(best.row.note);
  return [
    {
      id: `civil-immigration-near-${best.city}-${best.idx}`,
      name: best.row.name,
      address: best.row.address,
      phone: best.row.phone,
      lat: best.row.lat,
      lng: best.row.lng,
      category: "출입국·외국인청",
      processableTasks: [...tasks, "현재 위치 기준 가까운 체류민원 관서"],
      role: "immigration-civil" as const,
      jurisdictionMatch: false,
      canHandleTask: true,
      distanceMeters: best.distanceMeters,
      hours: "평일 09:00–18:00 (기관별 상이 · 1345 확인)",
      provider: IMMIGRATION_SOURCE.provider,
      dataset: IMMIGRATION_SOURCE.dataset,
      datasetUrl: IMMIGRATION_SOURCE.datasetUrl,
      asOf: IMMIGRATION_SOURCE.asOf,
      live: false,
    },
  ];
}

async function searchNearbyByCoords(
  coords: UserCoords,
): Promise<{ places: RecommendedPlace[]; error?: string }> {
  const queries = ["행정복지센터", "주민센터", "구청"];
  const location = { lat: coords.lat, lng: coords.lng, radius: 8000 };
  const seen = new Set<string>();
  const places: RecommendedPlace[] = [];
  let error: string | undefined;

  for (const query of queries) {
    const kakao = await searchKakaoPlaces(query, 8, location);
    if (kakao.error && !error) error = kakao.error;
    for (const place of kakao.places) {
      if (seen.has(place.id)) continue;
      if (!isPhysicalPlaceName(place.placeName, place.roadAddress || place.address)) continue;
      if (isImmigrationCheckpoint(place.placeName, place.roadAddress || place.address, place.category)) {
        continue;
      }
      const name = place.placeName;
      const category = place.category;
      const role = roleOf(name, category);
      if (
        role === "other" &&
        !isLikelyCommunityCenter(name, category) &&
        !isLikelyDistrictOffice(name, category)
      ) {
        continue;
      }
      if (/무인민원발급/.test(name)) continue;
      seen.add(place.id);
      const resolvedRole = role === "other" ? "community-center" : role;
      places.push({
        id: place.id,
        name,
        address: place.roadAddress || place.address,
        phone: place.phone || undefined,
        lat: place.lat,
        lng: place.lng,
        category,
        processableTasks: [
          ...tasksForRole(resolvedRole),
          "현재 위치 근처 후보 · 정확한 관할은 새 주소 기준",
        ],
        role: resolvedRole,
        jurisdictionMatch: false,
        canHandleTask: true,
        distanceMeters: place.distanceMeters,
        hours: undefined,
        provider: ADMIN_SOURCE.provider,
        dataset: ADMIN_SOURCE.dataset,
        datasetUrl: ADMIN_SOURCE.datasetUrl,
        asOf: ADMIN_SOURCE.asOf,
        live: true,
        placeUrl: place.placeUrl,
      });
    }
  }

  return { places: sortPlaces(places).slice(0, 8), error };
}

export async function recommendResidenceChangePlaces(input: {
  situation: string;
  /** GPS — preferred for nearby map when new address is unknown. */
  coords?: UserCoords;
}): Promise<{
  places: RecommendedPlace[];
  residenceHint: ResidenceHint | null;
  needAddressPrompt?: string;
  errors: string[];
}> {
  const hint = parseResidenceHint(input.situation);
  const errors: string[] = [];

  if (!hint || !hint.enoughForJurisdiction) {
    // Map/places: use current location immediately — do not block on address input.
    if (input.coords) {
      const nearby = await searchNearbyByCoords(input.coords);
      if (nearby.error) errors.push(`nearby:${nearby.error}`);
      const immigration = nearestCivilImmigration(input.coords);
      return {
        places: pickBalancedPlaces([...nearby.places, ...immigration], 8),
        residenceHint: hint,
        errors,
      };
    }
    return {
      places: [],
      residenceHint: hint,
      needAddressPrompt: NEED_ADDRESS_PROMPT_KO,
      errors: [],
    };
  }

  const { places: adminPlaces, error } = await searchAreaFacilities(hint);
  if (error) errors.push(`admin:${error}`);

  const immigration = civilImmigrationForHint(hint, input.coords);

  const withDistance = adminPlaces.map((p) => {
    if (!input.coords || p.lat == null || p.lng == null) return p;
    return {
      ...p,
      distanceMeters: haversineMeters(input.coords.lat, input.coords.lng, p.lat, p.lng),
    };
  });

  const merged = pickBalancedPlaces([...withDistance, ...immigration], 8);
  return {
    places: merged,
    residenceHint: hint,
    errors,
  };
}

/** Map search queries for Kakao UI when residence-change is detected. */
export function residenceChangeMapQueries(situation: string): string[] {
  const hint = parseResidenceHint(situation);
  if (!hint?.enoughForJurisdiction) {
    return ["행정복지센터", "주민센터", "구청"];
  }
  const area = areaLabel(hint);
  return [
    `${area} 행정복지센터`,
    `${area} 주민센터`,
    hint.district ? `${hint.district}청` : `${area} 구청`,
    hint.city === "seoul" ? "서울출입국외국인청" : "부산출입국외국인청",
  ].filter(Boolean);
}
