import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { listAccessibleOrganizationIds } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db";
import { INSTITUTION_CATALOG } from "@/lib/institution/catalog";
import { ensureInstitutions } from "@/lib/institution/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const access = await listAccessibleOrganizationIds(session);
  if (access !== "all" && access.length === 0) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await ensureInstitutions();

  const [docCounts, knowledgeCounts] = await Promise.all([
    prisma.institutionDocument.groupBy({
      by: ["institutionId"],
      _count: { _all: true },
    }),
    prisma.institutionKnowledge.groupBy({
      by: ["institutionId"],
      _count: { _all: true },
    }),
  ]);

  const documentsById = Object.fromEntries(
    docCounts.map((row) => [row.institutionId, row._count._all]),
  );
  const knowledgeById = Object.fromEntries(
    knowledgeCounts.map((row) => [row.institutionId, row._count._all]),
  );

  const rows = access === "all"
    ? INSTITUTION_CATALOG
    : INSTITUTION_CATALOG.filter((row) => access.includes(row.id));

  return NextResponse.json({
    institutions: rows.map((row) => ({
      id: row.id,
      nameKo: row.nameKo,
      nameEn: row.nameEn,
      aliases: row.aliases,
      city: row.city,
      type: row.type,
      documentCount: documentsById[row.id] ?? 0,
      knowledgeCount: knowledgeById[row.id] ?? 0,
    })),
  });
}
