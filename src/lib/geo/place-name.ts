/** 같은 상호를 거리만 다른 중복으로 취급하기 위한 이름 키. */
export function placeNameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()[\]{}·.,\-/'"]/g, "");
}

/** 상호가 같으면 더 가까운(또는 먼저 나온) 한 곳만 남깁니다. */
export function dedupeByPlaceName<T>(
  rows: T[],
  getName: (row: T) => string,
  getDistance?: (row: T) => number | undefined,
): T[] {
  const best = new Map<string, T>();
  for (const row of rows) {
    const key = placeNameKey(getName(row));
    if (!key) continue;
    const prev = best.get(key);
    if (!prev) {
      best.set(key, row);
      continue;
    }
    if (!getDistance) continue;
    const nextD = getDistance(row);
    const prevD = getDistance(prev);
    if (nextD != null && (prevD == null || nextD < prevD)) best.set(key, row);
  }
  const picked = [...best.values()];
  if (!getDistance) return picked;
  return picked.sort((a, b) => {
    const da = getDistance(a);
    const db = getDistance(b);
    if (da == null && db == null) return 0;
    if (da == null) return 1;
    if (db == null) return -1;
    return da - db;
  });
}
