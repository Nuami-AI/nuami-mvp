import type { GuideRegion, ReasonedGuide, SearchResult, StayType } from "./types";

const BEHAVIOR_ORDER = ["prepare", "move", "apply", "confirm"] as const;

function notesForStayType(stayType: StayType, scenarioId?: string): string[] {
  if (scenarioId === "bank-account") {
    if (stayType === "D-2") {
      return ["D-2는 재학증명서를 함께 가져가면 외국인 창구 심사가 수월하다."];
    }
    if (stayType === "D-4") {
      return ["D-4는 어학당 재학(등록) 확인서 또는 표준입학허가서를 지참한다."];
    }
  }
  if (scenarioId === "residence-change") {
    return [
      "D-2·D-4 모두 이사 후 15일 이내 체류지 변경 신고 대상이다.",
      stayType === "D-2"
        ? "기숙사면 학교 생활관 확인서를, 원룸이면 임대차계약서를 준비한다."
        : "숙소 계약서 또는 기숙사/하숙 확인서를 빠뜨리지 않는다.",
    ];
  }
  if (scenarioId === "hospital" && stayType !== "other") {
    return ["유학생 건강보험 자격을 앱이나 카드로 확인해 두면 접수 시간이 줄어든다."];
  }
  return [];
}

export function reasonGuide(input: {
  search: SearchResult;
  stayType: StayType;
  region?: GuideRegion;
  lifeStage?: string;
  liveAgencies?: string[];
}): ReasonedGuide {
  const scenario = input.search.primary;
  const region = input.region ?? "other";
  const stayType = input.stayType;

  const agencies =
    input.liveAgencies && input.liveAgencies.length > 0
      ? input.liveAgencies
      : scenario?.agencies ?? [];

  const documents = [...(scenario?.documents ?? [])];
  if (scenario?.id === "bank-account" && stayType === "D-4") {
    const idx = documents.findIndex((item) => item.includes("재학"));
    if (idx >= 0) documents[idx] = "어학당 재학확인서 또는 표준입학허가서";
  }

  const conditions = [...(scenario?.conditions ?? [])];
  if (input.lifeStage === "arrived") {
    conditions.unshift("입국 초기라면 기본 절차부터 순서대로 따른다.");
  }

  return {
    stayType,
    region,
    scenario,
    agencies,
    documents,
    conditions,
    behaviorOrder: [...BEHAVIOR_ORDER],
    notes: notesForStayType(stayType, scenario?.id),
  };
}
