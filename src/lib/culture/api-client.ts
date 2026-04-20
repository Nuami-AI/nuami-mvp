import type { CulturalEvent } from "./types";

const API_KEY = process.env.CULTURE_API_KEY ?? process.env.DATA_GO_KR_KEY;

export async function fetchNearbyEvents(placeName: string): Promise<CulturalEvent[]> {
  if (!API_KEY) {
    return [];
  }

  try {
    const encoded = encodeURIComponent(placeName);
    const url = `https://www.culture.go.kr/openapi/rest/publicperformancedisplays/area?serviceKey=${API_KEY}&sido=${encoded}&numOfRows=5&type=json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const json = (await res.json()) as unknown;
    return parseEvents(json);
  } catch {
    console.warn("[culture-api] fetch failed — returning empty list");
    return [];
  }
}

function parseEvents(json: unknown): CulturalEvent[] {
  try {
    // culture.go.kr response shape varies — best-effort parse
    const root = json as Record<string, unknown>;
    const items =
      (root?.msgBody as Record<string, unknown>)?.perforList ??
      (root?.response as Record<string, unknown>)?.body;

    if (!Array.isArray(items)) return [];

    return (items as Record<string, unknown>[]).map((item) => ({
      title: String(item.title ?? item.performTitle ?? ""),
      place: String(item.place ?? item.performPlace ?? ""),
      startDate: item.startDate ? String(item.startDate) : undefined,
      endDate: item.endDate ? String(item.endDate) : undefined,
      url: item.url ? String(item.url) : undefined,
    }));
  } catch {
    return [];
  }
}
