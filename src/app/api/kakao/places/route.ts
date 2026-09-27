import { NextResponse } from "next/server";

import { isMappableQuery, resolveMapSearchQuery, type ResultVenue } from "@/lib/kakao/query-builder";
import { getKakaoRestApiKey, searchKakaoPlacesMany } from "@/lib/kakao/search";
import {
  detectAdminTask,
  isImmigrationCheckpoint,
  mapQueriesForSituation,
  parseResidenceHint,
  recommendPlacesForSituation,
} from "@/lib/place-recommend";
import type { KakaoLocalPlace } from "@/types/kakao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VENUES = new Set<ResultVenue>(["store", "bank", "hospital", "immigration", "default"]);

function toKakaoPlace(row: {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  category?: string;
  distanceMeters?: number;
  placeUrl?: string;
  processableTasks?: string[];
  hours?: string;
  provider?: string;
  dataset?: string;
  datasetUrl?: string;
  asOf?: string;
}): KakaoLocalPlace {
  return {
    id: row.id,
    placeName: row.name,
    address: row.address ?? "",
    roadAddress: row.address ?? "",
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    placeUrl: row.placeUrl ?? row.datasetUrl ?? "",
    phone: row.phone ?? "",
    category: row.category ?? "",
    distanceMeters: row.distanceMeters,
    processableTasks: row.processableTasks,
    hours: row.hours,
    provider: row.provider,
    dataset: row.dataset,
    datasetUrl: row.datasetUrl,
    asOf: row.asOf,
  };
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const situation = searchParams.get("situation")?.trim() ?? query;
  const venueParam = searchParams.get("venue") ?? "default";
  const venue: ResultVenue = VENUES.has(venueParam as ResultVenue)
    ? (venueParam as ResultVenue)
    : "default";
  const extra = searchParams.getAll("extra").map((v) => v.trim()).filter((v) => v && isMappableQuery(v));
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const lat = latParam ? Number.parseFloat(latParam) : NaN;
  const lng = lngParam ? Number.parseFloat(lngParam) : NaN;
  const location =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? { lat, lng, radius: 20000 }
      : undefined;

  const configured = Boolean(getKakaoRestApiKey());
  const jsKeyConfigured = Boolean(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
  const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "";

  if (!situation && !query && extra.length === 0) {
    return NextResponse.json({ places: [], configured, jsKeyConfigured, jsKey });
  }

  if (!configured) {
    return NextResponse.json({
      places: [],
      configured: false,
      jsKeyConfigured,
      jsKey,
    });
  }

  const task = detectAdminTask(situation || query);
  const isResidenceFlow = task.id === "residence-change" || venue === "immigration";

  if (isResidenceFlow) {
    const recommended = await recommendPlacesForSituation({
      situation: situation || query,
      coords: location,
    });

    if (recommended.places.length > 0) {
      return NextResponse.json({
        places: recommended.places.map(toKakaoPlace),
        configured: true,
        jsKeyConfigured,
        jsKey,
        taskLabel: recommended.taskLabel,
        residenceHint: recommended.residenceHint,
        searchQueries: mapQueriesForSituation(situation || query, venue) ?? [],
        primaryQuery: recommended.places[0]?.name ?? "",
        sortedByDistance: Boolean(location),
        // Soft note only — never block the map for address entry
        locationBased: !recommended.residenceHint?.enoughForJurisdiction && Boolean(location),
      });
    }

    // No GPS yet: ask client to use current location (not new-address form)
    if (!location) {
      return NextResponse.json({
        places: [],
        configured: true,
        jsKeyConfigured,
        jsKey,
        taskLabel: recommended.taskLabel,
        awaitingLocation: true,
        searchQueries: mapQueriesForSituation(situation || query, venue) ?? [],
        sortedByDistance: false,
      });
    }

    return NextResponse.json({
      places: [],
      configured: true,
      jsKeyConfigured,
      jsKey,
      taskLabel: recommended.taskLabel,
      residenceHint: recommended.residenceHint,
      searchQueries: mapQueriesForSituation(situation || query, venue) ?? [],
      sortedByDistance: true,
    });
  }

  const taskQueries = mapQueriesForSituation(situation || query, venue);
  const { primary, queries: searchQueries } = resolveMapSearchQuery({
    situation: situation || query,
    venue,
    whereTo: extra,
    explicitQuery: query,
  });

  const effectiveQueries =
    taskQueries && taskQueries.length > 0
      ? taskQueries
      : searchQueries.length > 0
        ? searchQueries
        : primary
          ? [primary]
          : [];

  if (effectiveQueries.length === 0) {
    return NextResponse.json({
      places: [],
      configured: true,
      jsKeyConfigured,
      jsKey,
      searchQueries: [],
      sortedByDistance: Boolean(location),
    });
  }

  const { places, error } = await searchKakaoPlacesMany(effectiveQueries, 5, location);
  const filtered = places.filter(
    (p) => !isImmigrationCheckpoint(p.placeName, p.roadAddress || p.address, p.category),
  );

  return NextResponse.json({
    places: filtered,
    configured: true,
    jsKeyConfigured,
    jsKey,
    error,
    searchQueries: effectiveQueries,
    primaryQuery: effectiveQueries[0],
    sortedByDistance: Boolean(location),
    residenceHint: parseResidenceHint(situation || query),
  });
}
