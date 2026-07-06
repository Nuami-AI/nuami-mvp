import type { ExtractionResult, ProductItem } from "./extraction";

export type SaveItemType =
  | "guide"
  | "product"
  | "tip"
  | "phrase"
  | "place"
  | "action"
  | "checklist"
  | "document"
  | "memo";

export interface SavedItem {
  id: string;
  type: SaveItemType;
  title: string;
  body?: string;
  memo?: string;
  checked: boolean;
  situation?: string;
  sourceUrl?: string;
  videoTitle?: string;
  brand?: string;
  category?: string;
  searchQuery?: string;
  oliveYoungGoodsNo?: string;
  payload?: Partial<ExtractionResult>;
  createdAt: string;
  updatedAt: string;
}

export function productToSaveItem(
  product: ProductItem,
  ctx: { situation?: string; sourceUrl?: string; videoTitle?: string },
): Omit<SavedItem, "id" | "createdAt" | "updatedAt"> {
  return {
    type: "product",
    title: product.brand ? `${product.brand} ${product.name}` : product.name,
    body: product.reason,
    memo: product.memo ?? "",
    checked: false,
    situation: ctx.situation,
    sourceUrl: ctx.sourceUrl,
    videoTitle: ctx.videoTitle,
    brand: product.brand,
    category: product.category,
    searchQuery: product.searchQuery ?? product.name,
  };
}
