import { NextResponse } from "next/server";

import { fetchNearbyEvents } from "@/lib/culture/api-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const place = searchParams.get("place")?.trim() ?? "";

  if (!place) {
    return NextResponse.json({ events: [] }, { status: 200 });
  }

  const events = await fetchNearbyEvents(place);
  return NextResponse.json({ events }, { status: 200 });
}
