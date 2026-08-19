import type { VerifiedScenario } from "./types";

/** Location-aware official scenarios used by the Search stage. Facts are grounded in public rules. */
export const VERIFIED_SCENARIOS: VerifiedScenario[] = [
  {
    id: "residence-change",
    keywords: [
      "체류지", "전입", "이사", "주소변경", "주소 변경", "전입신고",
      "residence", "address change", "move", "moving", "report address",
      "住居地", "転入", "引っ越し", "住所変更",
      "chuyển chỗ ở", "đổi địa chỉ", "chuyển nhà",
      "居留地", "迁入", "搬家", "地址变更",
    ],
    asOf: "2026-08",
    sources: [
      { name: "출입국관리법 제31조", url: "https://www.law.go.kr" },
      { name: "하이코리아", url: "https://www.hikorea.go.kr" },
      { name: "출입국·외국인청" },
    ],
    region: "other",
    stayTypes: ["D-2", "D-4", "other"],
    location: "가까운 출입국·외국인청 (HiKorea 전자민원도 가능)",
    procedure: ["준비", "이동", "신청", "확인"],
    conditions: [
      "전입한 날부터 15일 이내 체류지 변경 신고",
      "D-2·D-4 유학생 모두 신고 대상",
      "기숙사 입사 시 학교 발급 숙소확인서 가능",
    ],
    documents: [
      "외국인등록증",
      "임대차계약서 또는 숙소 확인 서류",
      "체류지 변경 신고서",
      "여권",
    ],
    agencies: ["가까운 출입국·외국인청"],
    deadline: "전입한 날부터 15일 이내",
    facts: [
      "90일 이상 체류 외국인은 체류지가 바뀌면 전입일부터 15일 이내 신고해야 한다.",
      "방문 신청은 현재 거주지 관할 출입국·외국인청에서 하고, 일부 건은 HiKorea 전자민원으로도 신청할 수 있다.",
      "미신고 시 과태료가 부과될 수 있다.",
    ],
  },
  {
    id: "bank-account",
    keywords: [
      "은행", "계좌", "통장", "체크카드", "계좌개설", "계좌 만들",
      "bank", "account", "open account",
      "銀行", "口座",
      "ngân hàng", "mở tài khoản",
      "银行", "开户", "账户",
    ],
    asOf: "2026-08",
    sources: [
      { name: "금융감독원 외국인 금융거래 안내" },
      { name: "각 은행 외국인 창구 안내" },
    ],
    region: "other",
    stayTypes: ["D-2", "D-4", "other"],
    location: "외국인 창구가 있는 가까운 은행 지점",
    procedure: ["준비", "이동", "신청", "확인"],
    conditions: [
      "외국인등록증이 있으면 개설이 수월하다",
      "일부 지점은 재학증명서 또는 표준입학허가서가 필요하다",
      "휴대폰 본인확인이 안 되면 창구 대면 개설만 가능하다",
    ],
    documents: [
      "여권",
      "외국인등록증",
      "재학증명서 또는 표준입학허가서",
      "한국 휴대폰 번호",
    ],
    agencies: ["외국인 창구가 있는 가까운 은행"],
    facts: [
      "유학생은 보통 여권·외국인등록증·재학 증빙을 지참하고 외국인 창구에서 개설한다.",
      "번호표를 뽑은 뒤 창구에서 계좌 목적(생활비·등록금)을 말하면 안내가 빠르다.",
      "체크카드 수령과 인터넷뱅킹 신청은 같은 방문에서 처리할 수 있는 경우가 많다.",
    ],
  },
  {
    id: "hospital",
    keywords: [
      "병원", "진료", "약국", "아프", "감기", "건강검진", "원무과",
      "hospital", "clinic", "pharmacy", "doctor", "sick",
      "病院", "診療", "薬局",
      "bệnh viện", "phòng khám", "nhà thuốc",
      "医院", "看病", "药店",
    ],
    asOf: "2026-08",
    sources: [
      { name: "국민건강보험공단", url: "https://www.nhis.or.kr" },
      { name: "보건복지부 외국인 진료 안내" },
    ],
    region: "other",
    stayTypes: ["D-2", "D-4", "other"],
    location: "가까운 의원 원무과 또는 대학병원 국제진료센터",
    procedure: ["준비", "이동", "신청", "확인"],
    conditions: [
      "건강보험 가입 시 본인부담이 줄어든다",
      "대학병원은 예약이 필요한 경우가 많다",
      "응급이 아니면 동네 의원을 먼저 방문한다",
    ],
    documents: [
      "외국인등록증",
      "여권",
      "건강보험증 또는 자격확인 화면",
    ],
    agencies: ["가까운 의원 원무과", "대학병원 국제진료센터", "약국"],
    facts: [
      "한국 병원은 접수(원무과) → 대기 → 진료 → 수납 → 약국 순서다.",
      "유학생은 외국인등록증과 건강보험 자격을 창구에서 확인한다.",
      "처방전은 병원 근처 약국에서 조제한다.",
    ],
  },
];
