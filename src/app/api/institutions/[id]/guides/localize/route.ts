import { NextResponse } from "next/server";

import { commonSectionsForLang } from "@/lib/guide/adapt-cards";
import { localizeAndPersistGuides, normalizeUiLang } from "@/lib/institution/localize";
import { listInstitutionGuides } from "@/lib/institution/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { lang?: unknown } | null;
  const lang = normalizeUiLang(typeof body?.lang === "string" ? body.lang : "ko");

  const guides = await listInstitutionGuides(id);
  if (!guides) return NextResponse.json({ items: [], sections: commonSectionsForLang(lang) });

  const items = await localizeAndPersistGuides(id, guides.items, lang);
  return NextResponse.json({ items, sections: commonSectionsForLang(lang) });
}
