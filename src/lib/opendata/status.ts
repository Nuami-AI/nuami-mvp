export type OpenDataCategory =
  | "STUDENT_UNIVERSITY"
  | "IMMIGRATION_STAY"
  | "ADMIN_FACILITY"
  | "TRANSPORT"
  | "HEALTHCARE"
  | "FOREIGNER_SUPPORT"
  | "CULTURE_LIVING"
  | "ADDRESS_GEO"
  | "HOUSING";

export type OpenDataRegion = "NATIONAL" | "SEOUL" | "BUSAN";

export type OpenDataSourceType = "OPEN_API" | "FILE" | "OFFICIAL_WEB";

export type OpenDataStatus = "PLANNED" | "CONNECTED" | "ERROR" | "INACTIVE";

export type MvpUsage =
  | "Situation Card"
  | "Action Card"
  | "Context Card"
  | "Guide Library"
  | "Map / Place Search"
  | "Onboarding / Profile"
  | "Travel Assist";

export type Priority = "P0" | "P1" | "P2";

export interface OpenDataIntegration {
  id: string;
  name: string;
  category: OpenDataCategory;
  provider: string;
  region: OpenDataRegion;
  sourceType: OpenDataSourceType;
  /** Declared target status; runtime may downgrade CONNECTED → ERROR if env missing */
  status: OpenDataStatus;
  priority: Priority;
  envKey: string | null;
  datasetId?: string;
  datasetUrl?: string;
  mvpUsage: MvpUsage[];
  scenarios: string[];
  notes?: string;
}

export const CATEGORY_LABEL: Record<OpenDataCategory, string> = {
  STUDENT_UNIVERSITY: "유학생·대학",
  IMMIGRATION_STAY: "출입국·체류",
  ADMIN_FACILITY: "행정·민원시설",
  TRANSPORT: "교통",
  HEALTHCARE: "병원·약국·보건",
  FOREIGNER_SUPPORT: "외국인지원",
  CULTURE_LIVING: "문화·생활시설",
  ADDRESS_GEO: "주소·위치",
  HOUSING: "주거·정착",
};

export const REGION_LABEL: Record<OpenDataRegion, string> = {
  NATIONAL: "전국",
  SEOUL: "서울",
  BUSAN: "부산",
};

export const SOURCE_TYPE_LABEL: Record<OpenDataSourceType, string> = {
  OPEN_API: "OpenAPI",
  FILE: "파일",
  OFFICIAL_WEB: "공식 웹",
};

export const STATUS_LABEL: Record<OpenDataStatus, string> = {
  PLANNED: "예정",
  CONNECTED: "연동됨",
  ERROR: "오류/미설정",
  INACTIVE: "비활성",
};

/**
 * Catalog = what we use and why.
 * env = secrets only. Adding an env var does NOT auto-create a row.
 */
export const OPEN_DATA_INTEGRATIONS: OpenDataIntegration[] = [
  // ── P0: Health (already wired) ───────────────────────────────────────────
  {
    id: "healthcare-hospitals",
    name: "병원정보서비스",
    category: "HEALTHCARE",
    provider: "건강보험심사평가원",
    region: "NATIONAL",
    sourceType: "OPEN_API",
    status: "CONNECTED",
    priority: "P0",
    envKey: "DATA_GO_KR_KEY",
    datasetId: "15001698",
    datasetUrl: "https://www.data.go.kr/data/15001698/openapi.do",
    mvpUsage: ["Situation Card", "Action Card", "Map / Place Search"],
    scenarios: ["병원 이용", "몸이 아플 때", "진료과 확인"],
    notes: "서울/부산은 지역 필터만 적용. 전국 단일 integration.",
  },
  {
    id: "healthcare-pharmacies",
    name: "전국 약국 정보 조회 서비스",
    category: "HEALTHCARE",
    provider: "국립중앙의료원",
    region: "NATIONAL",
    sourceType: "OPEN_API",
    status: "CONNECTED",
    priority: "P0",
    envKey: "DATA_GO_KR_KEY",
    datasetId: "15000576",
    datasetUrl: "https://www.data.go.kr/data/15000576/openapi.do",
    mvpUsage: ["Action Card", "Map / Place Search"],
    scenarios: ["약국 찾기", "병원 이용 후 조제"],
  },
  {
    id: "healthcare-public-health",
    name: "보건소 기관 정보",
    category: "HEALTHCARE",
    provider: "보건복지부 / 지자체",
    region: "NATIONAL",
    sourceType: "OPEN_API",
    status: "CONNECTED",
    priority: "P0",
    envKey: "KAKAO_MAP_API_KEY",
    datasetUrl: "https://www.data.go.kr",
    mvpUsage: ["Action Card", "Map / Place Search"],
    scenarios: ["보건소 찾기", "예방접종·건강검진 안내"],
    notes: "MVP: 카카오 장소검색. data.go.kr 전용 API는 추후 교체 가능.",
  },

  // ── P0: Immigration / stay ───────────────────────────────────────────────
  {
    id: "immigration-offices",
    name: "출입국·외국인청 소속기관 안내",
    category: "IMMIGRATION_STAY",
    provider: "법무부 출입국·외국인정책본부",
    region: "NATIONAL",
    sourceType: "OFFICIAL_WEB",
    status: "CONNECTED",
    priority: "P0",
    envKey: null,
    datasetUrl: "https://www.immigration.go.kr",
    mvpUsage: ["Action Card", "Context Card", "Guide Library", "Map / Place Search"],
    scenarios: ["외국인등록", "체류지 변경", "체류 관련 신고"],
    notes: "코드 내 서울/부산 공식 목록 + 카카오 위치 보강.",
  },
  {
    id: "immigration-hikorea",
    name: "HiKorea 전자민원·체류 안내",
    category: "IMMIGRATION_STAY",
    provider: "법무부 HiKorea",
    region: "NATIONAL",
    sourceType: "OFFICIAL_WEB",
    status: "CONNECTED",
    priority: "P0",
    envKey: null,
    datasetUrl: "https://www.hikorea.go.kr",
    mvpUsage: ["Action Card", "Context Card", "Guide Library"],
    scenarios: ["외국인등록", "체류기간 연장", "체류자격 변경"],
    notes: "OpenAPI 아님. 공식 절차·서류 Context 근거.",
  },

  // ── P0: Address / geo ────────────────────────────────────────────────────
  {
    id: "geo-kakao-local",
    name: "카카오 로컬(장소 검색)",
    category: "ADDRESS_GEO",
    provider: "카카오",
    region: "NATIONAL",
    sourceType: "OPEN_API",
    status: "CONNECTED",
    priority: "P0",
    envKey: "KAKAO_MAP_API_KEY",
    datasetUrl: "https://developers.kakao.com/docs/latest/ko/local/dev-guide",
    mvpUsage: ["Map / Place Search", "Action Card", "Travel Assist"],
    scenarios: ["가까운 기관 찾기", "은행·출입국·병원 위치", "이동 보조"],
  },
  {
    id: "geo-kakao-map-js",
    name: "카카오 지도 JavaScript",
    category: "ADDRESS_GEO",
    provider: "카카오",
    region: "NATIONAL",
    sourceType: "OPEN_API",
    status: "CONNECTED",
    priority: "P0",
    envKey: "NEXT_PUBLIC_KAKAO_JS_KEY",
    datasetUrl: "https://developers.kakao.com/docs/latest/ko/map/overview",
    mvpUsage: ["Map / Place Search"],
    scenarios: ["결과 화면 지도 표시"],
    notes: "브라우저 공개키(NEXT_PUBLIC_*). 서버 REST 키와 분리.",
  },
  {
    id: "geo-road-name-address",
    name: "도로명주소·행정구역",
    category: "ADDRESS_GEO",
    provider: "행정안전부 / 국토교통부",
    region: "NATIONAL",
    sourceType: "OPEN_API",
    status: "CONNECTED",
    priority: "P0",
    envKey: "KAKAO_MAP_API_KEY",
    datasetUrl: "https://www.juso.go.kr",
    mvpUsage: ["Map / Place Search", "Onboarding / Profile", "Situation Card"],
    scenarios: ["주소 → 좌표", "서울/부산 지역 분기", "관할 기관 매칭"],
    notes: "MVP: 카카오 주소검색 geocode. 행정안전부 juso API는 추후 교체 가능.",
  },

  // ── P0: Admin facilities ─────────────────────────────────────────────────
  {
    id: "admin-community-centers",
    name: "주민센터·구청·시청 등 민원시설",
    category: "ADMIN_FACILITY",
    provider: "행정안전부 / 서울특별시 / 부산광역시",
    region: "NATIONAL",
    sourceType: "OPEN_API",
    status: "CONNECTED",
    priority: "P0",
    envKey: "KAKAO_MAP_API_KEY",
    datasetUrl: "https://www.data.go.kr",
    mvpUsage: ["Action Card", "Map / Place Search", "Situation Card"],
    scenarios: ["주소 변경", "전입신고", "관할 주민센터 방문"],
    notes: "전국 공통 + 조회 시 지역 필터. MVP는 카카오 장소검색.",
  },

  // ── P1: Transport ────────────────────────────────────────────────────────
  {
    id: "transport-seoul-bus",
    name: "서울 버스 정류장·노선",
    category: "TRANSPORT",
    provider: "서울특별시",
    region: "SEOUL",
    sourceType: "OPEN_API",
    status: "PLANNED",
    priority: "P1",
    envKey: "DATA_GO_KR_KEY",
    datasetUrl: "https://www.data.go.kr",
    mvpUsage: ["Travel Assist", "Action Card", "Map / Place Search"],
    scenarios: ["구청·병원·출입국 방문 이동"],
  },
  {
    id: "transport-busan-bus",
    name: "부산 버스 정류장·노선",
    category: "TRANSPORT",
    provider: "부산광역시",
    region: "BUSAN",
    sourceType: "OPEN_API",
    status: "PLANNED",
    priority: "P1",
    envKey: "DATA_GO_KR_KEY",
    datasetUrl: "https://www.data.go.kr",
    mvpUsage: ["Travel Assist", "Action Card", "Map / Place Search"],
    scenarios: ["구청·병원·출입국 방문 이동"],
  },
  {
    id: "transport-subway",
    name: "지하철역·노선 정보",
    category: "TRANSPORT",
    provider: "서울교통공사 / 부산교통공사 / 국토교통부",
    region: "NATIONAL",
    sourceType: "OPEN_API",
    status: "PLANNED",
    priority: "P1",
    envKey: "DATA_GO_KR_KEY",
    datasetUrl: "https://www.data.go.kr",
    mvpUsage: ["Travel Assist", "Map / Place Search"],
    scenarios: ["가까운 역 안내", "대중교통 접근"],
    notes: "실시간 도착은 안정화 후 추가. MVP는 기본 접근정보 우선.",
  },

  // ── P1: Foreigner support ────────────────────────────────────────────────
  {
    id: "support-seoul-global",
    name: "서울 외국인주민·글로벌센터",
    category: "FOREIGNER_SUPPORT",
    provider: "서울특별시",
    region: "SEOUL",
    sourceType: "OFFICIAL_WEB",
    status: "PLANNED",
    priority: "P1",
    envKey: null,
    datasetUrl: "https://global.seoul.go.kr",
    mvpUsage: ["Guide Library", "Action Card", "Map / Place Search"],
    scenarios: ["생활 상담", "통역·번역", "체류·행정 도움"],
  },
  {
    id: "support-busan-global",
    name: "부산 외국인지원·다문화 기관",
    category: "FOREIGNER_SUPPORT",
    provider: "부산광역시",
    region: "BUSAN",
    sourceType: "OFFICIAL_WEB",
    status: "PLANNED",
    priority: "P1",
    envKey: null,
    datasetUrl: "https://www.busan.go.kr",
    mvpUsage: ["Guide Library", "Action Card", "Map / Place Search"],
    scenarios: ["생활 상담", "지역 프로그램", "행정 도움"],
  },

  // ── P1: Housing ──────────────────────────────────────────────────────────
  {
    id: "housing-hug",
    name: "주택보증·전월세 공식정보 (HUG)",
    category: "HOUSING",
    provider: "주택도시보증공사(HUG)",
    region: "NATIONAL",
    sourceType: "OFFICIAL_WEB",
    status: "PLANNED",
    priority: "P1",
    envKey: null,
    datasetUrl: "https://www.khug.or.kr",
    mvpUsage: ["Action Card", "Context Card", "Guide Library"],
    scenarios: ["원룸 이사", "계약 전 확인", "보증·지원정보"],
    notes: "억지 OpenAPI 금지. 공식 웹/파일로 관리.",
  },
  {
    id: "housing-molit-guide",
    name: "국토교통부·지자체 주거 공식안내",
    category: "HOUSING",
    provider: "국토교통부 / 서울특별시 / 부산광역시",
    region: "NATIONAL",
    sourceType: "OFFICIAL_WEB",
    status: "PLANNED",
    priority: "P1",
    envKey: null,
    datasetUrl: "https://www.molit.go.kr",
    mvpUsage: ["Action Card", "Context Card", "Guide Library"],
    scenarios: ["기숙사→원룸 이사", "이사 후 주소 변경", "공공 주거지원"],
  },

  // ── P2: Student / university ─────────────────────────────────────────────
  {
    id: "student-university-catalog",
    name: "대학 기본정보·기관 카탈로그",
    category: "STUDENT_UNIVERSITY",
    provider: "교육부 / Study in Korea / NUAMI 카탈로그",
    region: "NATIONAL",
    sourceType: "FILE",
    status: "CONNECTED",
    priority: "P2",
    envKey: null,
    datasetUrl: "https://www.studyinkorea.go.kr",
    mvpUsage: ["Onboarding / Profile", "Situation Card", "Guide Library"],
    scenarios: ["소속 대학 확인", "서울/부산 기관 분기", "기관 SaaS 콘텐츠"],
    notes: "실시간 Q&A용이 아니라 region/university 맥락 기준 데이터. 현재 INSTITUTION_CATALOG.",
  },
  {
    id: "student-foreign-stats",
    name: "외국인 유학생 통계",
    category: "STUDENT_UNIVERSITY",
    provider: "교육부 / 한국교육개발원",
    region: "NATIONAL",
    sourceType: "FILE",
    status: "PLANNED",
    priority: "P2",
    envKey: null,
    datasetUrl: "https://www.moe.go.kr",
    mvpUsage: ["Onboarding / Profile", "Situation Card"],
    scenarios: ["지역·대학별 유학생 현황 맥락"],
  },

  // ── P2: Culture / living ─────────────────────────────────────────────────
  {
    id: "culture-portal-events",
    name: "공연·전시 등 문화정보",
    category: "CULTURE_LIVING",
    provider: "문화포털(문화체육관광부)",
    region: "NATIONAL",
    sourceType: "OPEN_API",
    status: "INACTIVE",
    priority: "P2",
    envKey: "CULTURE_API_KEY",
    datasetUrl: "https://www.culture.go.kr/openapi",
    mvpUsage: ["Guide Library", "Context Card"],
    scenarios: ["지역 생활 적응", "문화시설 탐색"],
    notes: "MVP 핵심 Action보다 우선순위 낮음. 모듈 정리 후 재활성화 가능.",
  },
  {
    id: "culture-libraries-seoul",
    name: "서울 공공도서관·문화·체육시설",
    category: "CULTURE_LIVING",
    provider: "서울특별시",
    region: "SEOUL",
    sourceType: "OPEN_API",
    status: "PLANNED",
    priority: "P2",
    envKey: "DATA_GO_KR_KEY",
    datasetUrl: "https://data.seoul.go.kr",
    mvpUsage: ["Guide Library", "Context Card", "Map / Place Search"],
    scenarios: ["근처 도서관", "공공 체육시설", "지역 생활 인프라"],
  },
  {
    id: "culture-libraries-busan",
    name: "부산 공공도서관·문화·체육시설",
    category: "CULTURE_LIVING",
    provider: "부산광역시",
    region: "BUSAN",
    sourceType: "OPEN_API",
    status: "PLANNED",
    priority: "P2",
    envKey: "DATA_GO_KR_KEY",
    datasetUrl: "https://data.busan.go.kr",
    mvpUsage: ["Guide Library", "Context Card", "Map / Place Search"],
    scenarios: ["근처 도서관", "공공 체육시설", "지역 생활 인프라"],
  },
];

export function maskSecret(value: string | undefined | null): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (v.length <= 8) return "••••••••";
  return `${"•".repeat(Math.min(12, v.length - 4))}${v.slice(-4)}`;
}

function resolveRuntimeStatus(row: OpenDataIntegration): {
  status: OpenDataStatus;
  configured: boolean;
  maskedKey: string | null;
  publicNote?: string;
} {
  if (!row.envKey) {
    return {
      status: row.status,
      configured: row.status === "CONNECTED",
      maskedKey: null,
      publicNote: row.sourceType === "OFFICIAL_WEB" || row.sourceType === "FILE" ? "키 불필요" : undefined,
    };
  }

  const raw = process.env[row.envKey]?.trim();
  const configured = Boolean(raw);
  const maskedKey = maskSecret(raw);

  if (row.status === "PLANNED" || row.status === "INACTIVE") {
    return { status: row.status, configured, maskedKey };
  }

  if (row.status === "CONNECTED" && !configured) {
    return { status: "ERROR", configured: false, maskedKey: null };
  }

  return { status: row.status, configured, maskedKey };
}

export function listOpenDataStatus(syncResults?: Record<string, import("./sync").SyncProbeResult>) {
  return OPEN_DATA_INTEGRATIONS.map((row) => {
    const runtime = resolveRuntimeStatus(row);
    const sync = syncResults?.[row.id];
    const runtimeStatus = sync ? sync.status : runtime.status;
    return {
      ...row,
      runtimeStatus,
      configured: runtime.configured,
      maskedKey: runtime.maskedKey,
      publicNote: runtime.publicNote,
      lastSyncedAt: sync?.syncedAt,
      syncMessage: sync?.message,
      syncSampleCount: sync?.sampleCount,
      syncOk: sync?.ok,
    };
  });
}

export type OpenDataStatusRow = ReturnType<typeof listOpenDataStatus>[number];
