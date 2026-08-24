import { searchKakaoAddress } from "@/lib/kakao/search";
import { regionFromCoords } from "@/lib/geo/region";

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  region: ReturnType<typeof regionFromCoords>;
  live: boolean;
}

export async function geocodeRoadAddress(
  addressQuery: string,
): Promise<{ result?: GeocodeResult; error?: string }> {
  const trimmed = addressQuery.trim();
  if (!trimmed) return { error: "address required" };

  const kakao = await searchKakaoAddress(trimmed);
  if (kakao.error || kakao.lat == null || kakao.lng == null) {
    return { error: kakao.error ?? "geocode failed" };
  }

  return {
    result: {
      lat: kakao.lat,
      lng: kakao.lng,
      address: kakao.address ?? trimmed,
      region: regionFromCoords(kakao.lat, kakao.lng),
      live: true,
    },
  };
}
