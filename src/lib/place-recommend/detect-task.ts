import type { AdminTaskId } from "./types";

const TASK_RULES: Array<{ id: AdminTaskId; label: string; pattern: RegExp }> = [
  {
    id: "residence-change",
    label: "외국인 체류지 변경 신고",
    pattern:
      /체류지|전입|이사|주소\s*변경|주소변경|원룸|기숙사|chuyển nhà|chuyển từ|đổi địa chỉ|chuyển chỗ|phòng trọ|ký túc xá|搬家|居留地|引っ越し|住居地|address\s*change|moving|move\s*(in|out|from)|report\s*(my\s*)?(new\s*)?address|residence\s*change/i,
  },
  {
    id: "bank-account",
    label: "은행 계좌 개설",
    pattern: /은행|계좌|통장|bank|account|銀行|口座|ngân hàng|mở tài khoản|开户/i,
  },
  {
    id: "hospital",
    label: "병원·약국 이용",
    pattern: /병원|약국|아플|진료|hospital|clinic|pharmacy|病院|약국|phòng khám/i,
  },
];

export function detectAdminTask(situation: string): { id: AdminTaskId; label: string } {
  const text = situation.trim();
  if (!text) return { id: "unknown", label: "일반 안내" };

  // Moving dorm→room should win over generic housing→real-estate map intent.
  for (const rule of TASK_RULES) {
    if (rule.pattern.test(text)) return { id: rule.id, label: rule.label };
  }
  return { id: "unknown", label: "일반 안내" };
}
