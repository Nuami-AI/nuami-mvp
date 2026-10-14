const ACTOR_TYPE_KO: Record<string, string> = {
  INTERNAL: "콘솔",
  ORG_STAFF: "기관",
  ORG_REQUEST: "기관 신청",
  END_USER: "엔드유저",
};

const ACTION_KO: Record<string, string> = {
  "auth.user.create": "계정 추가",
  "auth.user.update": "계정 수정",
  "auth.user.password.reset": "비밀번호 초기화",
  "auth.user.deactivate": "계정 비활성화",
  "auth.user.activate": "계정 활성화",
  "auth.user.delete": "계정 삭제",
  "auth.user.credits.update": "크레딧 변경",
  "org.staff.issue": "기관 계정 발급",
  "org.staff.password.reset": "기관 계정 비밀번호 초기화",
  "org.staff.deactivate": "기관 계정 비활성화",
  "org.staff.activate": "기관 계정 활성화",
  "org.staff.delete": "기관 계정 삭제",
  "org.staff.role.change": "기관 역할 변경",
  "org.access": "기관 접근",
  "org.access.request": "기관 접근 신청",
  "console.operator.issue": "콘솔 접근자 추가",
  "console.operator.revoke": "콘솔 접근자 해제",
  "knowledge.opinion.create": "전문가 의견 추가",
  "knowledge.opinion.update": "전문가 의견 수정",
  "knowledge.opinion.delete": "전문가 의견 삭제",
  "knowledge.provider.create": "자료 제공처 추가",
  "knowledge.provider.update": "자료 제공처 수정",
  "knowledge.provider.delete": "자료 제공처 삭제",
  "knowledge.asset.create": "지식자료 추가",
  "knowledge.asset.update": "지식자료 수정",
  "knowledge.asset.delete": "지식자료 삭제",
  "knowledge.asset.status": "지식자료 상태 변경",
  "content.upload": "자료 업로드",
  "content.source.create": "출처 추가",
  "content.source.learn": "출처 학습",
  "content.source.delete": "출처 삭제",
  "content.knowledge.delete": "안내 지식 삭제",
  "settings.write": "설정 변경",
};

export function auditActorTypeLabel(value: string): string {
  return ACTOR_TYPE_KO[value] ?? value;
}

export function auditActionLabel(value: string): string {
  return ACTION_KO[value] ?? value;
}
