import { NextResponse } from "next/server";

import { fetchOpenDataForScenario } from "@/lib/opendata/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const scenario = searchParams.get("scenario");
  const id =
    scenario === "hospital" || scenario === "residence-change" || scenario === "bank-account"
      ? scenario
      : undefined;
  const lat = Number.parseFloat(searchParams.get("lat") ?? "");
  const lng = Number.parseFloat(searchParams.get("lng") ?? "");
  const coords =
    Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;
  const result = await fetchOpenDataForScenario(id, coords);
  return NextResponse.json(result);
}
