/** Mock student IDs until official verification exists. Pattern: `{school}1234`. */
const CONSOLE_BYPASS_STUDENT_ID = "nuami";

function prefixForInstitution(institutionId: string): string {
  return institutionId.replace(/-university$/, "").replace(/-national$/, "").replace(/-/g, "");
}

function normalizeStudentId(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function mockStudentIdFor(institutionId: string): string {
  return `${prefixForInstitution(institutionId)}1234`;
}

export function isMockVerifiedStudentId(value: string, institutionId: string): boolean {
  const entered = normalizeStudentId(value);
  if (!entered || !institutionId) return false;
  return entered === mockStudentIdFor(institutionId).toLowerCase();
}

/** 콘솔(INTERNAL) 계정만 학번 `nuami`로 소속대학을 인증할 수 있습니다. */
export function isVerifiedStudentId(
  value: string,
  institutionId: string,
  options?: { allowConsoleBypass?: boolean },
): boolean {
  if (isMockVerifiedStudentId(value, institutionId)) return true;
  if (!options?.allowConsoleBypass) return false;
  return normalizeStudentId(value) === CONSOLE_BYPASS_STUDENT_ID;
}
