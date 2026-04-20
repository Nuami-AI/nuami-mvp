import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env" });
dotenvConfig({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function getPoolConfig(): Record<string, unknown> {
  if (process.env.DB_HOST) {
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 4000;
    return {
      host: process.env.DB_HOST,
      port: Number.isNaN(port) ? 4000 : port,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE ?? "nuami",
      connectTimeout: 30_000,
      ssl: { rejectUnauthorized: true },
    };
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL or DB_HOST required");
  const parsed = new URL(url.replace(/^mysql:\/\//i, "https://"));
  return {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, "") || "nuami",
    connectTimeout: 30_000,
    ssl: { rejectUnauthorized: true },
  };
}

const adapter = new PrismaMariaDb(
  getPoolConfig() as ConstructorParameters<typeof PrismaMariaDb>[0]
);
const prisma = new PrismaClient({ adapter });

interface SeedPost {
  title: string;
  summary: string;
  body: string;
  country: string;
  category: string;
  tags: string[];
  language: string;
}

const SEED_DATA: SeedPost[] = [
  // KR - Culture (4개)
  {
    country: "KR", category: "culture", language: "ko",
    title: "한국 식당 예절 완전 가이드",
    summary: "한국 식당에서 알아야 할 필수 예절 10가지",
    body: "## 식당 입장\n\n한국 식당에 들어서면 먼저 자리를 직접 찾아 앉으세요. 일부 식당은 번호표를 뽑거나 직원이 안내합니다.\n\n## 주문 방법\n\n테이블에 있는 벨을 누르거나 \"저기요!\"라고 큰 소리로 직원을 부르세요. 조용히 손짓하는 것만으로는 불충분할 수 있습니다.\n\n## 반찬 문화\n\n한국 식당에서는 반찬이 무료로 제공됩니다. 더 달라고 요청하면 추가로 줍니다.\n\n## 수저 예절\n\n- 밥그릇을 들고 먹지 않습니다 (일본과 다름)\n- 어른이 먼저 식사를 시작할 때까지 기다립니다\n- 숟가락과 젓가락을 동시에 사용하지 않습니다",
    tags: ["식당", "예절", "한국음식", "식사문화"],
  },
  {
    country: "KR", category: "culture", language: "ko",
    title: "한국 지하철 에티켓 완전 가이드",
    summary: "서울 지하철에서 외국인이 꼭 알아야 할 10가지 규칙",
    body: "## 노약자 배려석\n\n분홍색 또는 파란색의 노약자 배려석에는 앉지 마세요. 비어있어도 임산부, 노인, 장애인을 위한 자리입니다.\n\n## 음식 반입\n\n지하철 내 음식 섭취는 엄격히 금지되어 있지는 않지만 냄새가 나는 음식은 피하는 것이 예의입니다.\n\n## 통화 에티켓\n\n전화 통화 시 작은 목소리로 하거나 '지금 지하철이에요, 나중에 연락할게요'라고 말하고 끊는 것이 일반적입니다.\n\n## 탑승 방법\n\n- 양쪽으로 줄을 서서 가운데 통로를 비워둡니다\n- 내리는 사람이 먼저 나온 뒤 탑승합니다",
    tags: ["지하철", "서울", "교통", "에티켓"],
  },
  {
    country: "KR", category: "culture", language: "ko",
    title: "한국 술자리 문화 이해하기",
    summary: "한국인과 함께하는 술자리에서 자연스럽게 어울리는 방법",
    body: "## 잔 채우기\n\n한국에서는 상대방의 잔이 비면 채워주는 것이 예의입니다. 자기 잔을 직접 채우는 것보다 서로 채워주는 문화입니다.\n\n## 두 손으로 받기\n\n어른이나 윗사람이 술을 따라줄 때 두 손으로 잔을 받는 것이 예의입니다.\n\n## 건배 문화\n\n건배할 때는 '건배!', '위하여!', '짠!' 등을 사용합니다. 잔을 부딪힐 때 상대보다 낮게 하는 것이 예의입니다.\n\n## 거절하는 법\n\n술을 마시지 않을 경우 '저는 운전을 해야 해서요' 또는 '몸이 좋지 않아서요'라고 하면 대부분 이해합니다.",
    tags: ["술문화", "회식", "음주", "사교"],
  },
  {
    country: "KR", category: "culture", language: "ko",
    title: "한국 사우나(찜질방) 완벽 가이드",
    summary: "찜질방을 처음 방문하는 외국인을 위한 단계별 안내",
    body: "## 입장 방법\n\n입구에서 입장료를 내면 열쇠와 찜질복을 받습니다. 신발은 신발장에 보관합니다.\n\n## 탈의실\n\n탈의실은 남녀가 분리되어 있습니다. 탈의실에서는 수영복 없이 입욕합니다.\n\n## 찜질방 구역\n\n찜질복으로 갈아입고 공용 찜질방 구역을 이용합니다. 이 구역은 남녀 모두 이용 가능합니다.\n\n## 주의사항\n\n- 탕 안에서 비누 사용 금지\n- 수건을 깔고 앉기\n- 대화는 조용히",
    tags: ["찜질방", "목욕문화", "한국체험", "스파"],
  },
  // KR - Action (4개)
  {
    country: "KR", category: "action", language: "ko",
    title: "T-money 카드 구매 및 충전 가이드",
    summary: "서울 대중교통 이용을 위한 T-money 카드 완벽 사용법",
    body: "## T-money 카드란?\n\nT-money는 서울 지하철, 버스, 택시에서 사용 가능한 선불 교통카드입니다. 현금보다 할인 혜택이 있습니다.\n\n## 구매 방법\n\n편의점(CU, GS25, 세븐일레븐), 지하철역 자동판매기에서 구매 가능합니다. 카드 가격은 보통 2,500원입니다.\n\n## 충전 방법\n\n- 지하철역 충전기 사용\n- 편의점 계산대에서 충전\n- 최소 1,000원부터 충전 가능\n\n## 잔액 확인\n\n지하철 개찰구를 통과할 때 카드 리더기에 남은 금액이 표시됩니다.",
    tags: ["교통카드", "T-money", "지하철", "서울교통"],
  },
  {
    country: "KR", category: "action", language: "ko",
    title: "한국 편의점 200% 활용 가이드",
    summary: "24시간 편의점에서 할 수 있는 모든 것",
    body: "## 음식 데우기\n\n편의점에서 구매한 도시락은 계산대 근처의 전자레인지를 무료로 사용할 수 있습니다. 직원에게 '데워주세요'라고 하거나 직접 사용하면 됩니다.\n\n## 각종 서비스\n\n- ATM: 외국 카드 사용 가능\n- 택배 수령/발송\n- 공과금 납부\n- 복사/팩스\n\n## 편의점 요리\n\n컵라면에 뜨거운 물을 넣어 먹을 수 있습니다. 포크나 젓가락도 무료로 제공됩니다.\n\n## 꼭 먹어볼 것\n\n삼각김밥, 바나나우유, 불닭볶음면, 편의점 치킨",
    tags: ["편의점", "GS25", "CU", "한국생활"],
  },
  {
    country: "KR", category: "action", language: "ko",
    title: "카카오택시 사용법 완벽 가이드",
    summary: "한국에서 택시 잡는 가장 쉬운 방법",
    body: "## 앱 설치\n\n카카오택시는 카카오T 앱에서 사용할 수 있습니다. App Store 또는 Google Play에서 '카카오T'를 다운로드하세요.\n\n## 회원가입\n\n전화번호 인증이 필요합니다. 해외 번호도 인증 가능합니다.\n\n## 택시 호출\n\n1. 앱 실행 후 '택시' 선택\n2. 출발지와 목적지 입력\n3. 택시 종류 선택 (일반/모범/대형)\n4. 호출 버튼 클릭\n\n## 요금 결제\n\n신용카드를 앱에 등록하면 편리하게 결제할 수 있습니다.",
    tags: ["카카오택시", "택시", "교통", "앱"],
  },
  {
    country: "KR", category: "action", language: "ko",
    title: "한국 병원 이용 방법 가이드",
    summary: "외국인이 한국에서 병원을 이용하는 방법",
    body: "## 외국인 의료보험\n\n여행자 보험이 있다면 진료 후 영수증을 받아 귀국 후 보험 청구가 가능합니다.\n\n## 병원 찾기\n\n네이버 지도나 카카오맵에서 '병원', '내과', '치과' 등으로 검색하면 근처 병원을 찾을 수 있습니다.\n\n## 진료 절차\n\n1. 접수처에서 이름, 생년월일 등록\n2. 대기 후 진료\n3. 처방전 수령\n4. 약국에서 약 구매\n\n## 유용한 표현\n\n- '배가 아파요' = 위장 통증\n- '머리가 아파요' = 두통\n- '열이 나요' = 발열",
    tags: ["병원", "의료", "건강", "응급"],
  },
  // KR - Food (4개)
  {
    country: "KR", category: "food", language: "ko",
    title: "한국 길거리 음식 BEST 10",
    summary: "꼭 먹어봐야 할 한국 길거리 음식 완벽 가이드",
    body: "## 떡볶이\n\n매콤달콤한 소스에 쫄깃한 떡. 어묵과 함께 먹으면 더 맛있습니다. 매운 정도를 '안 맵게'라고 요청할 수 있습니다.\n\n## 순대\n\n당면, 야채 등을 돼지 창자에 넣어 만든 전통 음식. 소금이나 간장에 찍어 먹습니다.\n\n## 호떡\n\n겨울에 인기 있는 달콤한 전병. 흑설탕 시럽이 가득 들어 있습니다.\n\n## 붕어빵\n\n물고기 모양의 와플에 팥이나 슈크림이 들어 있습니다.\n\n## 닭꼬치\n\n간장 양념이나 소금 양념의 닭고기 꼬치.",
    tags: ["길거리음식", "떡볶이", "순대", "한국먹방"],
  },
  {
    country: "KR", category: "food", language: "ko",
    title: "한국 BBQ 완벽 주문 가이드",
    summary: "삼겹살, 갈비 등 한국 고기집에서 자신 있게 주문하는 방법",
    body: "## 인기 메뉴\n\n- 삼겹살: 가장 인기 있는 돼지고기 부위\n- 목살: 삼겹살보다 쫄깃한 식감\n- 소갈비: 소고기 갈비, 고소한 맛\n- 대패삼겹살: 얇게 썬 삼겹살\n\n## 굽는 방법\n\n보통 직원이 고기를 직접 구워줍니다. 충분히 익을 때까지 기다리세요.\n\n## 먹는 방법\n\n상추나 깻잎에 고기, 마늘, 쌈장을 올려 쌈을 만들어 먹습니다.\n\n## 필수 사이드\n\n냉면 또는 된장찌개를 마지막에 시키는 것이 일반적입니다.",
    tags: ["삼겹살", "BBQ", "고기집", "한국음식"],
  },
  {
    country: "KR", category: "food", language: "ko",
    title: "한국 편의점 음식 추천 리스트",
    summary: "편의점에서 꼭 먹어봐야 할 음식 추천",
    body: "## 즉석 식품\n\n- 삼각김밥: 참치마요, 불고기 등 다양한 맛\n- 도시락: 전자레인지로 데워 먹는 즉석 밥\n- 컵라면: 신라면, 진라면 등 다양한 종류\n\n## 간식\n\n- 포키: 초콜릿 코팅 과자 스틱\n- 빼빼로: 한국판 포키, 다양한 맛\n- 새우깡: 새우 맛 과자\n\n## 음료\n\n- 바나나우유: 달콤한 바나나 우유\n- 초코우유: 진한 초코 우유\n- 식혜: 전통 쌀 음료",
    tags: ["편의점음식", "간식", "추천", "한국음식"],
  },
  {
    country: "KR", category: "food", language: "ko",
    title: "한국 치킨 문화 완벽 이해",
    summary: "치맥부터 배달까지, 한국 치킨 문화 파헤치기",
    body: "## 한국 치킨이 특별한 이유\n\n한국 치킨은 두 번 튀겨 바삭함이 오래 유지됩니다. 다양한 소스와 함께 제공됩니다.\n\n## 인기 종류\n\n- 후라이드: 기본 프라이드 치킨\n- 양념치킨: 매콤달콤한 소스 코팅\n- 간장치킨: 달콤한 간장 소스\n- 반반: 후라이드와 양념 반반\n\n## 치맥\n\n치킨과 맥주의 조합. 야외에서 먹는 '치맥'은 한국의 여름 문화입니다.\n\n## 배달 앱\n\n배달의민족, 쿠팡이츠 앱으로 호텔까지 배달 주문 가능합니다.",
    tags: ["치킨", "치맥", "배달", "한국음식"],
  },
  // KR - Transport (4개)
  {
    country: "KR", category: "transport", language: "ko",
    title: "인천공항에서 서울 시내 이동 완벽 가이드",
    summary: "인천공항 도착 후 서울 시내로 가는 4가지 방법",
    body: "## 공항철도 (AREX)\n\n가장 저렴하고 편리한 방법입니다. 직통열차는 약 43분 소요, 요금 9,500원.\n\n## 리무진 버스\n\n목적지 근처 버스 정류장까지 직접 연결. 요금 15,000-18,000원, 교통 상황에 따라 1-2시간 소요.\n\n## 택시\n\n일반 택시 약 60,000-80,000원, 모범 택시 약 80,000-100,000원. 공항 택시 승강장에서 탑승.\n\n## 렌터카\n\n공항 1층 렌터카 카운터에서 대여 가능. 국제 운전면허증 필요.",
    tags: ["인천공항", "교통", "서울", "이동방법"],
  },
  {
    country: "KR", category: "transport", language: "ko",
    title: "서울 버스 완벽 이용 가이드",
    summary: "색깔로 구분되는 서울 버스 시스템 완벽 이해",
    body: "## 버스 종류\n\n서울 버스는 색깔로 구분됩니다:\n- 파란 버스: 간선 버스, 주요 도로 운행\n- 초록 버스: 지선 버스, 골목길 운행\n- 빨간 버스: 광역 버스, 수도권 연결\n- 노란 버스: 순환 버스, 도심 순환\n\n## 탑승 방법\n\n1. 정류장에서 대기\n2. 버스 번호 확인\n3. 앞문으로 탑승, 카드 태그\n4. 뒷문으로 하차, 카드 태그\n\n## 하차 방법\n\n하차 전에 하차 벨을 눌러야 합니다.",
    tags: ["버스", "서울교통", "대중교통", "이동"],
  },
  {
    country: "KR", category: "transport", language: "ko",
    title: "한국 KTX 기차 예약 가이드",
    summary: "서울에서 부산까지 2시간 30분, KTX 예약 방법",
    body: "## KTX란?\n\nKTX는 한국 고속철도로 서울-부산 간 약 2시간 30분이 소요됩니다.\n\n## 예약 방법\n\n- 코레일 홈페이지 (korail.com)\n- 코레일 앱\n- 역 창구 직접 구매\n- 여행사\n\n## 좌석 종류\n\n- 일반실: 일반 좌석\n- 특실: 더 넓은 좌석, 서비스 포함\n\n## 주요 노선\n\n- 경부선: 서울-동대구-부산\n- 호남선: 서울-광주-목포\n- 경강선: 서울-강릉\n\n## 주의사항\n\n출발 1일 전까지 환불 시 수수료 없음.",
    tags: ["KTX", "기차", "고속철도", "국내여행"],
  },
  {
    country: "KR", category: "transport", language: "ko",
    title: "서울 관광지 이동 최적 루트",
    summary: "경복궁, 남산타워, 동대문을 효율적으로 돌아보는 방법",
    body: "## 추천 1일 코스\n\n경복궁 → 인사동 → 북촌한옥마을 → 삼청동\n\n## 이동 수단\n\n이 코스는 모두 도보 또는 버스로 이동 가능합니다.\n\n## 남산타워 가는 법\n\n- 지하철 4호선 명동역 하차 후 도보 20분 또는 남산순환버스\n- 케이블카 이용 가능 (편도 10,000원)\n\n## 동대문 쇼핑\n\n지하철 1호선 또는 4호선 동대문역사문화공원역 하차. 동대문디자인플라자(DDP) 근처에 쇼핑몰 밀집.",
    tags: ["관광", "경복궁", "남산", "서울여행"],
  },
  // JP - Culture (4개)
  {
    country: "JP", category: "culture", language: "ko",
    title: "일본 사원/신사 방문 예절 완전 가이드",
    summary: "도리이 통과부터 참배까지, 일본 성지 방문 완벽 에티켓",
    body: "## 도리이(鳥居) 통과\n\n도리이를 통과할 때는 양쪽 기둥 사이를 걸어야 합니다. 중앙은 신이 다니는 길입니다.\n\n## 정수(手水舍) 의식\n\n1. 오른손으로 국자를 들어 왼손을 씻습니다\n2. 왼손으로 오른손을 씻습니다\n3. 왼손에 물을 받아 입을 헹굽니다\n4. 국자를 세워 손잡이를 씻습니다\n\n## 참배 방법\n\n신사: 2번 절 → 2번 박수 → 1번 절 (이배이박일배)\n사원: 합장 후 1번 절, 박수 없음\n\n## 주의사항\n\n- 사진 촬영 금지 구역 확인\n- 큰 소리로 대화 금지",
    tags: ["신사", "사원", "일본문화", "예절"],
  },
  {
    country: "JP", category: "culture", language: "ko",
    title: "일본 온천(온센) 완벽 입욕 가이드",
    summary: "일본 온천에서 실수 없이 즐기는 방법",
    body: "## 들어가기 전\n\n- 수건, 세면 도구 준비\n- 탈의실에서 모든 옷 벗기\n- 귀중품은 락커에 보관\n\n## 몸 씻기\n\n온센에 들어가기 전 반드시 샤워로 몸을 씻어야 합니다. 탈의실 옆 세면 구역에서 앉아서 씻습니다.\n\n## 입욕 규칙\n\n- 수건을 욕탕에 넣지 않기\n- 타투가 있으면 이용 불가인 곳이 많음\n- 큰 소리로 대화 금지\n- 사진 촬영 절대 금지\n\n## 온도\n\n일본 온천은 보통 40-42도로 한국 목욕탕보다 뜨겁습니다.",
    tags: ["온센", "온천", "일본체험", "목욕"],
  },
  {
    country: "JP", category: "culture", language: "ko",
    title: "일본 선물(오미야게) 문화 이해",
    summary: "일본인에게 선물을 줄 때와 받을 때의 올바른 방법",
    body: "## 오미야게(お土産)란?\n\n일본에서는 여행을 다녀오면 직장 동료나 가족에게 특산품을 가져다주는 문화가 있습니다.\n\n## 선물 주는 방법\n\n- 두 손으로 정중히 건네기\n- '별것 아니지만...'이라고 겸손하게 말하기 (일본어: つまらないものですが)\n- 포장이 중요, 예쁘게 포장된 것을 선택\n\n## 선물 받는 방법\n\n- 즉시 개봉하지 않는 것이 예의\n- 감사 표현 (ありがとうございます)\n- 나중에 열어보고 감사 인사\n\n## 좋은 선물\n\n전통과자, 지역 특산품, 고급 차, 화장품",
    tags: ["선물문화", "오미야게", "일본예절", "쇼핑"],
  },
  {
    country: "JP", category: "culture", language: "ko",
    title: "일본 이자카야 완벽 즐기기",
    summary: "일본 선술집에서 주문부터 계산까지",
    body: "## 입장\n\n문을 열면 직원이 '이랏샤이마세!'라고 인사합니다. 인원수를 말하면 자리로 안내해 줍니다.\n\n## 오토오시\n\n자리에 앉으면 자동으로 작은 안주(오토오시)가 나오는 경우가 있습니다. 이건 자리값으로 비용이 청구됩니다.\n\n## 주문\n\n'스미마셍'을 외쳐 직원을 부르거나 테이블 버튼을 누릅니다.\n\n## 계산\n\n- '오카이케이 오네가이시마스' (계산해 주세요)\n- 일반적으로 테이블에서 계산\n- 더치페이(와리캉)도 가능\n\n## 추천 메뉴\n\n야키토리, 카라아게, 에다마메, 타코야키",
    tags: ["이자카야", "일본술집", "야키토리", "일본문화"],
  },
  // JP - Action (4개)
  {
    country: "JP", category: "action", language: "ko",
    title: "Suica 카드 완벽 사용 가이드",
    summary: "도쿄 대중교통의 필수품 Suica 카드 구매부터 환불까지",
    body: "## Suica란?\n\nSuica는 JR East가 발행하는 IC 카드로 전철, 버스, 편의점, 자판기에서 사용 가능합니다.\n\n## 구매 방법\n\n- JR역 자동발권기에서 구매\n- 한국어 언어 선택 가능\n- 500엔 보증금 포함, 최소 1,000엔 충전\n\n## 충전 방법\n\n- 역 자동발권기\n- 편의점\n- Suica 앱 (iPhone)\n\n## 환불\n\n귀국 시 JR 창구에서 잔액 + 보증금 500엔 환불 (수수료 220엔 차감)\n\n## 사용 가능 교통\n\nJR, 도쿄메트로, 도에이 지하철, 버스",
    tags: ["Suica", "교통카드", "도쿄교통", "IC카드"],
  },
  {
    country: "JP", category: "action", language: "ko",
    title: "일본 편의점(콘비니) 완벽 활용법",
    summary: "세계 최고 수준의 일본 편의점을 100% 활용하는 방법",
    body: "## 세 가지 주요 체인\n\n- 세븐일레븐 (세분): 가장 많은 점포\n- 패밀리마트 (패미마): 다양한 식품\n- 로손: 빵과 스위츠가 특히 좋음\n\n## 추천 음식\n\n- 7-11 도시락: 데워주는 서비스\n- 로손 크림빵: 유명한 인기 빵\n- 패미마 카레빵: 쫄깃한 도너츠 스타일\n\n## 편의점 서비스\n\n- ATM (7-11 ATM은 해외 카드 OK)\n- 복사/인쇄\n- 전자결제\n- 택배 발송/수령\n\n## 에티켓\n\n계산대 앞에서 '봉투 필요합니까?' 묻는 것은 유료이기 때문입니다.",
    tags: ["편의점", "콘비니", "세븐일레븐", "일본생활"],
  },
  {
    country: "JP", category: "action", language: "ko",
    title: "일본 자동판매기(지도한바이기) 완벽 가이드",
    summary: "세계에서 가장 많은 자판기 나라, 일본 자판기 활용법",
    body: "## 일본 자판기 종류\n\n일본에는 약 400만 대의 자판기가 있습니다:\n- 음료 자판기 (가장 일반적)\n- 음식 자판기 (라멘, 아이스크림)\n- 우산 자판기\n- 꽃 자판기\n- 의약품 자판기\n\n## 사용 방법\n\n1. 상품 선택\n2. 금액 투입\n3. 버튼 누르기\n4. 거스름돈 및 상품 수령\n\n## 결제 방법\n\n동전, 지폐, IC 카드(Suica 등), 요즘은 신용카드도 가능한 곳 증가\n\n## 특이한 자판기\n\n신주쿠역 근처에는 된장국 자판기도 있습니다.",
    tags: ["자판기", "일본문화", "편리함", "음료"],
  },
  {
    country: "JP", category: "action", language: "ko",
    title: "일본 의료 서비스 이용 가이드",
    summary: "일본에서 아플 때 병원 이용하는 방법",
    body: "## 응급 상황\n\n- 구급차: 119\n- 경찰: 110\n- 24시간 영어 지원: #7119\n\n## 약국 (드럭스토어)\n\n가벼운 증상은 약국에서 해결 가능합니다. 마츠키요사(松本清), 코스모스 등이 대형 체인입니다.\n\n## 병원 방문\n\n- 건강보험증 없으면 10할 부담\n- 외국인 환자 받는 병원 목록: JNTO 홈페이지 참고\n- '영어 가능합니까?' = 英語はできますか?\n\n## 여행자 보험\n\n일본은 의료비가 비쌀 수 있으므로 여행자 보험 필수입니다.",
    tags: ["병원", "의료", "응급", "여행자보험"],
  },
  // JP - Food (4개)
  {
    country: "JP", category: "food", language: "ko",
    title: "도쿄 라멘 완벽 주문 가이드",
    summary: "자동발매기부터 맛 커스터마이징까지",
    body: "## 주문 방법\n\n대부분의 라멘 가게는 입구에 자동발매기가 있습니다:\n1. 원하는 라멘 버튼 선택\n2. 돈 넣기\n3. 식권 받아서 직원에게 전달\n\n## 맛 조절\n\n직원이 묻는 항목들:\n- 면의 굵기: 후토멘(굵음)/호소멘(가늘음)\n- 국물 농도: 코이(진함)/아사이(연함)\n- 기름: 오오메(많음)/스쿠나메(적음)\n- 마늘: 아리(있음)/나시(없음)\n\n## 주요 종류\n\n- 쇼유라멘: 간장 베이스, 맑은 국물\n- 미소라멘: 된장 베이스, 삿포로식\n- 시오라멘: 소금 베이스, 가장 맑음\n- 돈코츠라멘: 돼지뼈 베이스, 진한 국물",
    tags: ["라멘", "도쿄음식", "일본음식", "주문방법"],
  },
  {
    country: "JP", category: "food", language: "ko",
    title: "일본 스시 레스토랑 완벽 가이드",
    summary: "카이텐스시부터 고급 오마카세까지",
    body: "## 카이텐스시 (회전 초밥)\n\n벨트로 접시가 돌아가는 방식. 원하는 접시를 집어 먹고 접시 수로 계산합니다.\n\n## 주문 방법\n\n터치 패널 또는 큰 소리로 직원에게 주문:\n- 'X 하나 주세요': Xをひとつください\n\n## 알아두면 좋은 스시 용어\n\n- 사리(シャリ): 밥\n- 네타(ネタ): 생선 등 올라가는 재료\n- 오테(お手): 손으로 먹어도 됨\n- 가리: 생강\n- 와사비 나시: 와사비 없이\n\n## 계산\n\n식사 후 '오카이케이 오네가이시마스'라고 하면 됩니다.",
    tags: ["스시", "초밥", "일본음식", "카이텐"],
  },
  {
    country: "JP", category: "food", language: "ko",
    title: "오사카 길거리 음식 완벽 가이드",
    summary: "타코야키부터 오코노미야키까지 오사카 음식 투어",
    body: "## 타코야키\n\n문어가 들어간 동그란 반죽. 가장 유명한 오사카 음식입니다.\n\n## 오코노미야키\n\n'원하는 것을 굽는다'는 뜻의 일본식 부침개. 오사카식은 재료를 모두 섞어서 굽습니다.\n\n## 쿠시카츠\n\n꼬치에 꿴 고기나 야채에 빵가루를 입혀 튀긴 음식. 소스에 두 번 찍는 것은 금지!\n\n## 먹어볼 곳\n\n- 도톤보리: 가장 유명한 미식 거리\n- 구로몬 시장: 신선한 해산물\n- 신사이바시: 스트리트 푸드\n\n## 오사카 사람들 표현\n\n'쿠이다오레' = 먹다가 망한다, 오사카 미식 문화를 표현하는 말",
    tags: ["타코야키", "오사카", "오코노미야키", "길거리음식"],
  },
  {
    country: "JP", category: "food", language: "ko",
    title: "일본 편의점 음식 추천 TOP 10",
    summary: "일본 여행에서 꼭 먹어봐야 할 편의점 음식",
    body: "## 빵/디저트\n\n- 로손 크림빵: 한국에서도 유명\n- 7-11 치즈케이크: 부드럽고 진한 맛\n- 패미마 앙버터: 팥과 버터의 조화\n\n## 식사\n\n- 오니기리(주먹밥): 다양한 종류, 200-250엔\n- 오뎅: 추운 날 따뜻한 어묵탕\n- 가라아게군: 로손의 유명 닭튀김\n\n## 음료\n\n- 녹차: 다양한 브랜드, 질 좋음\n- 과일 스무디: 편의점 퀄리티 높음\n- 캔 맥주: 아사히, 기린, 삿포로\n\n## 구매 팁\n\n유효기간이 짧은 것은 저녁에 할인하는 경우가 많습니다.",
    tags: ["편의점", "오니기리", "로손", "일본음식"],
  },
  // JP - Transport (4개)
  {
    country: "JP", category: "transport", language: "ko",
    title: "도쿄 지하철 완벽 이용 가이드",
    summary: "세계에서 가장 복잡한 도쿄 지하철, 어렵지 않게 이용하기",
    body: "## 노선 종류\n\n도쿄에는 두 가지 주요 지하철 운영사가 있습니다:\n- 도쿄메트로 (9개 노선)\n- 도에이 지하철 (4개 노선)\n\n## 앱 추천\n\n- Google Maps: 경로 검색에 최적\n- 도쿄메트로 앱: 노선도, 시간표\n- 조루단: 환승 정보 상세\n\n## 요금 체계\n\n거리별 요금제. 기본 요금 약 170-180엔부터 시작.\n\n## 에티켓\n\n- 화장 금지 (일부 여성 전용칸 제외)\n- 통화는 낮은 목소리로\n- 우선석 근처에서 스마트폰 무음 설정\n- 취침 자는 것은 허용됨",
    tags: ["도쿄지하철", "교통", "도쿄관광", "이동"],
  },
  {
    country: "JP", category: "transport", language: "ko",
    title: "신칸센(신간센) 탑승 완벽 가이드",
    summary: "일본 고속열차 예약부터 탑승까지",
    body: "## 신칸센이란?\n\n시속 300km 이상의 일본 고속열차. 도쿄-오사카 약 2시간 15분 소요.\n\n## 예약 방법\n\n- JR 패스 구매 시 좌석 예약 (외국인 할인)\n- 일본 JR 창구\n- JR EAST 홈페이지\n\n## JR 패스\n\n외국인 여행자를 위한 할인 패스. 입국 전 구매 필요. 여러 종류 신칸센 무제한 이용.\n\n## 탑승 방법\n\n1. 개찰구에서 JR 패스 또는 티켓 제시\n2. 호차 번호와 좌석 번호 확인\n3. 정확한 승강장 위치에서 대기\n4. 정시 출발 (1분도 안 기다림)\n\n## 기내 서비스\n\n도시락(에키벤)은 역 구내에서 구매 가능",
    tags: ["신칸센", "고속열차", "JR패스", "일본여행"],
  },
  {
    country: "JP", category: "transport", language: "ko",
    title: "나리타/하네다 공항에서 도쿄 시내 이동",
    summary: "두 공항에서 도쿄 시내로 가는 최선의 방법",
    body: "## 나리타 공항\n\n도쿄에서 약 60km 떨어진 메인 국제공항.\n\n이동 방법:\n- 나리타 익스프레스(NEX): 시부야/신주쿠까지 약 90분, 3,070엔\n- 케이세이 스카이라이너: 우에노까지 약 36분, 2,520엔\n- 리무진 버스: 호텔 근처 정류장까지, 3,100엔\n\n## 하네다 공항\n\n도심에서 약 15km. 국내선 메인.\n\n이동 방법:\n- 케이큐선: 시나가와까지 약 12분, 310엔\n- 도쿄모노레일: 하마마츠초까지 약 20분, 510엔\n- 리무진 버스: 많은 호텔 직접 연결\n\n## 어느 공항이 편리?\n\n하네다가 도심에서 훨씬 가깝고 저렴합니다.",
    tags: ["나리타공항", "하네다공항", "도쿄이동", "교통"],
  },
  {
    country: "JP", category: "transport", language: "ko",
    title: "일본 자전거 여행 가이드",
    summary: "자전거로 일본 도시와 시골을 탐험하는 방법",
    body: "## 자전거 대여\n\n- 역 근처 자전거 대여소\n- 관광 안내소\n- 도코모 바이크셰어 앱\n- 호텔 대여 서비스\n\n## 교통 규칙\n\n- 자전거는 차도 좌측으로 주행\n- 인도에서 탈 때는 보행자 우선\n- 음주 운전 엄금 (한국과 달리 처벌 있음)\n- 야간에는 반드시 조명 켜기\n\n## 주차\n\n자전거 불법 주차는 딱지를 뗍니다. 지정된 자전거 주차장 이용.\n\n## 추천 코스\n\n- 교토: 강변 자전거도로, 사원 투어\n- 오사카: 오사카성 공원 주변\n- 도쿄: 아라카와 강변 코스",
    tags: ["자전거", "사이클링", "친환경교통", "일본여행"],
  },
];

async function seed() {
  console.log(`Seeding ${SEED_DATA.length} content posts...`);

  let created = 0;
  let skipped = 0;

  for (const post of SEED_DATA) {
    try {
      const exists = await prisma.contentPost.findFirst({
        where: { title: post.title, country: post.country },
      });

      if (exists) {
        skipped++;
        continue;
      }

      await prisma.contentPost.create({
        data: {
          title: post.title,
          summary: post.summary,
          body: post.body,
          country: post.country,
          category: post.category,
          tags: JSON.stringify(post.tags),
          language: post.language,
          visibility: "PUBLIC",
        },
      });
      created++;
      process.stdout.write(`  [${created + skipped}/${SEED_DATA.length}] ${post.country}/${post.category}: ${post.title}\n`);
    } catch (err) {
      console.error(`  FAILED: ${post.title}`, err);
    }
  }

  console.log(`\nDone! Created: ${created}, Skipped (duplicate): ${skipped}`);
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
