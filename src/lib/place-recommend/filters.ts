/** Exclude ports, airports, and entry-inspection booths from civil residence-change recommendations. */
export function isImmigrationCheckpoint(name: string, address?: string, category?: string): boolean {
  const text = `${name} ${address ?? ""} ${category ?? ""}`;
  return /입국심사|출국심사|심사장|공항|항\s*터미널|여객터미널|크루즈|항구|항만|ferry|airport|checkpoint|immigration\s*inspection/i.test(
    text,
  );
}

export function isLikelyCommunityCenter(name: string, category?: string): boolean {
  if (/코인워시|세탁|카페|편의점|마트|약국|병원|미용|부동산|학원|PC방|무인민원발급/.test(name)) return false;
  const text = `${name} ${category ?? ""}`;
  return /(주민센터|행정복지센터)$/.test(name.trim()) || /Community\s*Service/i.test(text);
}

export function isLikelyDistrictOffice(name: string, category?: string): boolean {
  const text = `${name} ${category ?? ""}`;
  if (/주차장|주차|어린이집|도서관|보건소|미술관|문화|체육|민원실|안내소/.test(text)) return false;
  // Exact-ish office names: "금정구청", "부산광역시 금정구청" — not "금정구청어린이집"
  return /(?:^|[\s·])([가-힣]+(?:구청|시청|군청))$/.test(name.trim()) || /^(구청|시청|군청)$/.test(name.trim());
}

/** Civil immigration offices that handle stay/residence filings (not checkpoints). */
export function isCivilImmigrationOffice(name: string, address?: string, category?: string): boolean {
  if (isImmigrationCheckpoint(name, address, category)) return false;
  const text = `${name} ${category ?? ""}`;
  return /출입국|외국인청|외국인사무소|immigration/i.test(text);
}
