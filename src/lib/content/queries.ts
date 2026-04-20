import { prisma } from "@/lib/db";
import type {
  ContentPost,
  ContentListParams,
  ContentCountry,
  ContentCategory,
  ContentLanguage,
  ContentVisibility,
} from "./types";

type PrismaContentPost = {
  id: string;
  title: string;
  summary: string;
  body: string;
  country: string;
  category: string;
  tags: string;
  language: string;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
};

function toContentPost(row: PrismaContentPost): ContentPost {
  return {
    ...row,
    country: row.country as ContentCountry,
    category: row.category as ContentCategory,
    language: row.language as ContentLanguage,
    visibility: row.visibility as ContentVisibility,
    tags: (() => {
      try {
        return JSON.parse(row.tags) as string[];
      } catch {
        return [];
      }
    })(),
  };
}

export async function getContentPosts(params: ContentListParams = {}): Promise<{
  data: ContentPost[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, Math.max(1, params.limit ?? 12));
  const skip = (page - 1) * limit;

  const where = {
    visibility: "PUBLIC" as const,
    ...(params.country ? { country: params.country } : {}),
    ...(params.category ? { category: params.category } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.contentPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.contentPost.count({ where }),
  ]);

  return {
    data: rows.map(toContentPost),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getContentById(id: string): Promise<ContentPost | null> {
  const row = await prisma.contentPost.findUnique({ where: { id } });
  if (!row) return null;
  return toContentPost(row);
}
