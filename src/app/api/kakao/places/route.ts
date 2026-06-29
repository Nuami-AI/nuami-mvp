import { NextResponse } from "next/server";

import { buildKakaoSearchQueries, pickPrimaryKakaoQuery, type ResultVenue } from "@/lib/kakao/query-builder";
import { getKakaoRestApiKey, searchKakaoPlacesMany } from "@/lib/kakao/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VENUES = new Set<ResultVenue>(["store", "bank", "hospital", "default"]);

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const situation = searchParams.get("situation")?.trim() ?? query;
  const venueParam = searchParams.get("venue") ?? "default";
  const venue: ResultVenue = VENUES.has(venueParam as ResultVenue)
    ? (venueParam as ResultVenue)
    : "default";
  const extra = searchParams.getAll("extra").map((v) => v.trim()).filter(Boolean);

  const configured = Boolean(getKakaoRestApiKey());
  const jsKeyConfigured = Boolean(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);

  if (!situation && !query && extra.length === 0) {
    return NextResponse.json({ places: [], configured, jsKeyConfigured, jsKey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "" });
  }

  if (!configured) {
    return NextResponse.json({
      places: [],
      configured: false,
      jsKeyConfigured,
      jsKey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "",
    });
  }

  const built = buildKakaoSearchQueries({
    situation: situation || query,
    venue,
    whereTo: extra,
  });
  const primary = query || pickPrimaryKakaoQuery(built);
  const searchQueries = [...new Set([primary, ...built, ...extra])];

  const { places, error } = await searchKakaoPlacesMany(searchQueries, 4);

  return NextResponse.json({
    places,
    configured: true,
    jsKeyConfigured,
    jsKey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "",
    error,
    searchQueries: searchQueries.slice(0, 6),
  });
}
