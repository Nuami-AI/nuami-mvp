import { NextResponse } from "next/server";

import {
  oliveYoungSearchUrl,
  searchOliveYoungCatalog,
  type OliveYoungProduct,
} from "@/lib/oliveyoung/catalog";

export interface OliveYoungSearchResponse {
  query: string;
  products: OliveYoungProduct[];
  searchUrl: string;
  source: "catalog";
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(12, Math.max(1, Number(searchParams.get("limit") ?? 6)));

  if (!query) {
    return NextResponse.json({ error: "MISSING_QUERY" }, { status: 400 });
  }

  const products = searchOliveYoungCatalog(query, limit);

  const body: OliveYoungSearchResponse = {
    query,
    products,
    searchUrl: oliveYoungSearchUrl(query),
    source: "catalog",
  };

  return NextResponse.json(body);
}
