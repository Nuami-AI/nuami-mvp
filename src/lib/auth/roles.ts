import { isInternalAccount } from "@/lib/auth/access";

export type SessionRole = "admin" | "tester";

export type NuamiRole =
  | "NUAMI_SUPER_ADMIN"
  | "NUAMI_OPERATOR"
  | "ORG_OWNER"
  | "ORG_ADMIN"
  | "ORG_EDITOR"
  | "ORG_VIEWER"
  | "USER";

export function isNuamiOperator(role: SessionRole | string | null | undefined): boolean {
  return isInternalAccount(role);
}

export const ORG_WRITE_ROLES = new Set<string>(["ORG_OWNER", "ORG_ADMIN", "ORG_EDITOR"]);
export const ORG_READ_ROLES = new Set<string>(["ORG_OWNER", "ORG_ADMIN", "ORG_EDITOR", "ORG_VIEWER"]);

const ORG_ROLE_LABEL: Record<string, string> = {
  NUAMI_SUPER_ADMIN: "슈퍼 어드민",
  ORG_OWNER: "대표",
  ORG_ADMIN: "관리자",
  ORG_EDITOR: "편집자",
  ORG_VIEWER: "조회자",
};

const ORG_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "사용 중",
  INACTIVE: "비활성",
};

export function orgRoleLabel(role: string): string {
  return ORG_ROLE_LABEL[role] ?? role;
}

export function orgStatusLabel(status: string): string {
  return ORG_STATUS_LABEL[status] ?? status;
}

/** 기관 담당자가 역할을 고를 때 보는 짧은 설명 */
const ORG_ROLE_HELP: Record<string, string> = {
  ORG_OWNER:
    "기관을 대표하는 계정입니다. 콘텐츠와 멤버를 모두 관리합니다. 대표 이관은 뉴아미에 문의해주세요.",
  ORG_ADMIN:
    "일상 운영을 맡는 계정입니다. 자료를 올리고, 담당자를 추가하거나 비밀번호를 초기화·비활성화할 수 있습니다.",
  ORG_EDITOR:
    "안내 자료를 등록하고 고치는 계정입니다. 멤버를 추가하거나 바꾸지는 못합니다.",
  ORG_VIEWER:
    "현황과 자료를 보기만 하는 계정입니다. 저장이나 멤버 관리는 할 수 없습니다.",
};

export function orgRoleHelp(role: string): string {
  return ORG_ROLE_HELP[role] ?? "";
}
