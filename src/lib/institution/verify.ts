/** Temporary mock until official student-number APIs exist. */
export const MOCK_VERIFIED_STUDENT_ID = "1234";

export function isMockVerifiedStudentId(value: string): boolean {
  return value.trim() === MOCK_VERIFIED_STUDENT_ID;
}
