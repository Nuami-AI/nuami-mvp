export type VideoResearchTopicId = "sale" | "trend" | "idol";

export interface VideoResearchTopic {
  id: VideoResearchTopicId;
  title: string;
  description: string;
  defaultSituation: string;
  emoji: string;
}

export const VIDEO_RESEARCH_TOPICS: VideoResearchTopic[] = [
  {
    id: "sale",
    emoji: "🏷️",
    title: "세일 제품을 확인하세요",
    description: "올영세일 인기템·할인 품목을 영상으로 미리 파악해요",
    defaultSituation: "올리브영 올영세일 추천 세일 제품과 할인 혜택",
  },
  {
    id: "trend",
    emoji: "✨",
    title: "K-뷰티 트렌드를 확인하세요",
    description: "쿨톤·웜톤, 글로시·매트 제형 등 지금 유행을 영상으로 정리해요",
    defaultSituation: "한국 K-뷰티 쿨톤 웜톤 글로시 매트 유행 트렌드",
  },
  {
    id: "idol",
    emoji: "🎤",
    title: "아이돌 메이크업을 확인하세요",
    description: "아이돌 화장 룩에서 지금 한국의 메이크업 유행을 읽어요",
    defaultSituation: "한국 아이돌 메이크업 유행 화장품 제형",
  },
];

export function getVideoResearchTopic(id: string | null): VideoResearchTopic {
  return VIDEO_RESEARCH_TOPICS.find((t) => t.id === id) ?? VIDEO_RESEARCH_TOPICS[0];
}

export const K_BEAUTY_TRENDS = [
  {
    id: "tone",
    label: "퍼스널컬러",
    items: ["쿨톤 — 핑크·로즈·베리 계열", "웜톤 — 코랄·피치·브릭 계열"],
    hint: "매장 '웜 베스트 / 쿨 베스트' 태그는 이 톤 구분을 뜻해요",
  },
  {
    id: "texture",
    label: "제형 유행",
    items: ["글로시 — 광택 틴트·글로우 쿠션", "매트 — 블러 틴트·보송 파우더"],
    hint: "시즌마다 글로시 ↔ 매트 중 하나가 더 뜨는 경우가 많아요",
  },
  {
    id: "idol",
    label: "아이돌 메이크업",
    items: ["아이돌 무대·셀카 메이크업", "연예인 착용 제품 리뷰 영상"],
    hint: "아이돌 화장을 보면 지금 한국에서 뜨는 색감·제형을 가장 빠르게 알 수 있어요",
  },
] as const;
