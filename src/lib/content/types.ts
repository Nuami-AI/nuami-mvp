export type ContentCountry = "KR" | "JP";
export type ContentCategory = "culture" | "action" | "food" | "transport";
export type ContentVisibility = "PUBLIC" | "DRAFT";
export type ContentLanguage = "ko" | "en" | "ja";

export interface ContentPost {
  id: string;
  title: string;
  summary: string;
  body: string;
  country: ContentCountry;
  category: ContentCategory;
  tags: string[];
  language: ContentLanguage;
  visibility: ContentVisibility;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentListParams {
  country?: ContentCountry;
  category?: ContentCategory;
  page?: number;
  limit?: number;
}

