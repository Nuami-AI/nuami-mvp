/** Mock student IDs until official verification exists. Pattern: `{school}1234`. */
function prefixForInstitution(institutionId: string): string {
  return institutionId.replace(/-university$/, "").replace(/-national$/, "").replace(/-/g, "");
}

export function mockStudentIdFor(institutionId: string): string {
  return `${prefixForInstitution(institutionId)}1234`;
}

export function isMockVerifiedStudentId(value: string, institutionId: string): boolean {
  const entered = value.trim().toLowerCase().replace(/\s+/g, "");
  if (!entered || !institutionId) return false;
  return entered === mockStudentIdFor(institutionId).toLowerCase();
}
