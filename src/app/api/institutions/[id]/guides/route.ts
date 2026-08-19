import { NextResponse } from "next/server";

import { commonSectionsForLang } from "@/lib/guide/adapt-cards";
import { listInstitutionGuides } from "@/lib/institution/search";
import { localizeGuideItems, normalizeUiLang } from "@/lib/institution/localize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const lang = normalizeUiLang(new URL(request.url).searchParams.get("lang") ?? "ko");
  const guides = await listInstitutionGuides(id);
  const sections = commonSectionsForLang(lang);
  if (!guides) {
    return NextResponse.json({ nameKo: "", nameEn: "", items: [], sections });
  }
  if (lang === "ko") {
    return NextResponse.json({ ...guides, sections });
  }
  try {
    const items = await localizeGuideItems(guides.items, lang);
    return NextResponse.json({ ...guides, items, sections });
  } catch {
    return NextResponse.json({ ...guides, sections });
  }
}
