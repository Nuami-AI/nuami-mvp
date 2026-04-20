import { NextRequest, NextResponse } from "next/server";
import { getContentPosts } from "@/lib/content/queries";
import type { ContentCountry, ContentCategory } from "@/lib/content/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const country = searchParams.get("country") as ContentCountry | null;
    const category = searchParams.get("category") as ContentCategory | null;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "12", 10);

    const validCountries = ["KR", "JP"];
    const validCategories = ["culture", "action", "food", "transport"];

    const result = await getContentPosts({
      country: country && validCountries.includes(country) ? country : undefined,
      category: category && validCategories.includes(category) ? category : undefined,
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 12 : limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/content]", error);
    return NextResponse.json({ data: [], meta: { total: 0, page: 1, limit: 12, totalPages: 0 } });
  }
}
