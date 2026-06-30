import { NextResponse } from "next/server";

import { resolveMapSearchQuery, type ResultVenue } from "@/lib/kakao/query-builder";
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
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const lat = latParam ? Number.parseFloat(latParam) : NaN;
  const lng = lngParam ? Number.parseFloat(lngParam) : NaN;
  const location =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? { lat, lng, radius: 8000 }
      : undefined;

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

  const { primary, queries: searchQueries } = resolveMapSearchQuery({
    situation: situation || query,
    venue,
    whereTo: extra,
    explicitQuery: query,
  });

  if (!primary && searchQueries.length === 0) {
    return NextResponse.json({
      places: [],
      configured: true,
      jsKeyConfigured,
      jsKey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "",
      searchQueries: [],
      sortedByDistance: Boolean(location),
    });
  }

  const { places, error } = await searchKakaoPlacesMany(
    searchQueries.length > 0 ? searchQueries : [primary],
    5,
    location,
  );

  return NextResponse.json({
    places,
    configured: true,
    jsKeyConfigured,
    jsKey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "",
    error,
    searchQueries,
    primaryQuery: primary,
    sortedByDistance: Boolean(location),
  });
}
