import { NextResponse } from "next/server";

import { INSTITUTION_CATALOG, type InstitutionSeed } from "@/lib/institution/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toPublicInstitution(row: InstitutionSeed) {
  return {
    id: row.id,
    nameKo: row.nameKo,
    nameEn: row.nameEn,
    aliases: row.aliases,
    city: row.city,
    type: row.type,
    knowledgeCount: 0,
    logoFile: row.logoFile ?? null,
  };
}

export async function GET(): Promise<Response> {
  return NextResponse.json({
    institutions: INSTITUTION_CATALOG.map(toPublicInstitution),
  });
}
