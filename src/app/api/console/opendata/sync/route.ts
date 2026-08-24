import { NextResponse } from "next/server";

import { requireNuamiOperator } from "@/lib/auth/require-admin";
import { listOpenDataStatus } from "@/lib/opendata/status";
import { getCachedP0Sync, syncP0Integrations } from "@/lib/opendata/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const cached = getCachedP0Sync();
  return NextResponse.json({
    ok: true,
    snapshot: cached,
    rows: listOpenDataStatus(cached?.results),
  });
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireNuamiOperator(request);
  if (auth.error || !auth.session) {
    return auth.error ?? NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const snapshot = await syncP0Integrations({ force });

  return NextResponse.json({
    ok: true,
    snapshot,
    rows: listOpenDataStatus(snapshot.results),
  });
}
