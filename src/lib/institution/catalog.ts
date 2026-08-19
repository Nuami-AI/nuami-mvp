export type InstitutionType = "university" | "language-institute" | "support-org";
export type KnowledgeCategory = "orientation" | "academic" | "living-tips" | "admin" | "learned";

export interface InstitutionSeed {
  id: string;
  nameKo: string;
  nameEn: string;
  aliases: string[];
  city: string;
  type: InstitutionType;
  /** public/university/{seoul|busan}/{logoFile}.svg */
  logoFile?: string;
}

export const CITY_DIR: Record<string, string> = {
  서울: "seoul",
  부산: "busan",
};

export function institutionLogoSrc(city: string, logoFile: string): string {
  const dir = CITY_DIR[city] ?? city.toLowerCase();
  return `/university/${dir}/${logoFile}.svg`;
}

export const INSTITUTION_CATALOG: InstitutionSeed[] = [
  // ── 서울 ──────────────────────────────────────────────────────────────────
  { id: "korea-university",    nameKo: "고려대학교",     nameEn: "Korea University",                aliases: ["고려대", "KU"],           city: "서울", type: "university", logoFile: "korea-university" },
  { id: "yonsei-university",   nameKo: "연세대학교",     nameEn: "Yonsei University",               aliases: ["연세대"],                  city: "서울", type: "university", logoFile: "yonsei-university" },
  { id: "seoul-national",      nameKo: "서울대학교",     nameEn: "Seoul National University",       aliases: ["서울대", "SNU"],           city: "서울", type: "university", logoFile: "seoul-national" },
  { id: "sungkyunkwan",        nameKo: "성균관대학교",   nameEn: "Sungkyunkwan University",         aliases: ["성균관대", "SKKU"],         city: "서울", type: "university", logoFile: "sungkyunkwan" },
  { id: "hanyang",             nameKo: "한양대학교",     nameEn: "Hanyang University",              aliases: ["한양대"],                  city: "서울", type: "university", logoFile: "hanyang" },
  { id: "sogang",              nameKo: "서강대학교",     nameEn: "Sogang University",               aliases: ["서강대"],                  city: "서울", type: "university", logoFile: "sogang" },
  { id: "ewha",                nameKo: "이화여자대학교", nameEn: "Ewha Womans University",          aliases: ["이화여대"],                city: "서울", type: "university", logoFile: "ewha" },
  { id: "kyunghee",            nameKo: "경희대학교",     nameEn: "Kyung Hee University",            aliases: ["경희대"],                  city: "서울", type: "university", logoFile: "kyunghee" },
  { id: "chungang",            nameKo: "중앙대학교",     nameEn: "Chung-Ang University",            aliases: ["중앙대", "CAU"],           city: "서울", type: "university", logoFile: "chungang" },
  { id: "hongik",              nameKo: "홍익대학교",     nameEn: "Hongik University",               aliases: ["홍익대"],                  city: "서울", type: "university", logoFile: "hongik" },
  { id: "dongguk",             nameKo: "동국대학교",     nameEn: "Dongguk University",              aliases: ["동국대"],                  city: "서울", type: "university", logoFile: "dongguk" },
  { id: "konkuk",              nameKo: "건국대학교",     nameEn: "Konkuk University",               aliases: ["건국대"],                  city: "서울", type: "university", logoFile: "konkuk" },
  { id: "kookmin",             nameKo: "국민대학교",     nameEn: "Kookmin University",              aliases: ["국민대"],                  city: "서울", type: "university", logoFile: "kookmin" },
  { id: "soongsil",            nameKo: "숭실대학교",     nameEn: "Soongsil University",             aliases: ["숭실대"],                  city: "서울", type: "university", logoFile: "soongsil" },
  { id: "sejong",              nameKo: "세종대학교",     nameEn: "Sejong University",               aliases: ["세종대"],                  city: "서울", type: "university", logoFile: "sejong" },
  { id: "kwangwoon",           nameKo: "광운대학교",     nameEn: "Kwangwoon University",            aliases: ["광운대"],                  city: "서울", type: "university", logoFile: "kwangwoon" },
  { id: "myongji",             nameKo: "명지대학교",     nameEn: "Myongji University",              aliases: ["명지대"],                  city: "서울", type: "university", logoFile: "myongji" },
  { id: "sungshin",            nameKo: "성신여자대학교", nameEn: "Sungshin Women's University",     aliases: ["성신여대"],                city: "서울", type: "university", logoFile: "sungshin" },
  { id: "sangmyung",           nameKo: "상명대학교",     nameEn: "Sangmyung University",            aliases: ["상명대"],                  city: "서울", type: "university", logoFile: "sangmyung" },
  { id: "duksung",             nameKo: "덕성여자대학교", nameEn: "Duksung Women's University",      aliases: ["덕성여대"],                city: "서울", type: "university", logoFile: "duksung" },
  { id: "dongduk",             nameKo: "동덕여자대학교", nameEn: "Dongduk Women's University",      aliases: ["동덕여대"],                city: "서울", type: "university", logoFile: "dongduk" },
  { id: "seoul-women",         nameKo: "서울여자대학교", nameEn: "Seoul Women's University",        aliases: ["서울여대"],                city: "서울", type: "university", logoFile: "seoul-women" },
  { id: "sookmyung",           nameKo: "숙명여자대학교", nameEn: "Sookmyung Women's University",    aliases: ["숙명여대"],                city: "서울", type: "university", logoFile: "sookmyung" },
  { id: "hansung",             nameKo: "한성대학교",     nameEn: "Hansung University",              aliases: ["한성대"],                  city: "서울", type: "university", logoFile: "hansung" },
  { id: "kaist-seoul",         nameKo: "카이스트",       nameEn: "KAIST",                           aliases: ["카이스트", "KAIST"],        city: "서울", type: "university", logoFile: "kaist-seoul" },
  { id: "seoultech",           nameKo: "서울과학기술대학교", nameEn: "Seoul National Univ. of Science and Technology", aliases: ["서울과기대", "SeoulTech"], city: "서울", type: "university", logoFile: "seoultech" },
  { id: "uos",                 nameKo: "서울시립대학교", nameEn: "University of Seoul",             aliases: ["서울시립대", "UOS"],        city: "서울", type: "university", logoFile: "uos" },
  { id: "catholic",            nameKo: "가톨릭대학교",   nameEn: "Catholic University of Korea",    aliases: ["가톨릭대"],                city: "서울", type: "university", logoFile: "catholic" },
  { id: "hankuk-foreign",      nameKo: "한국외국어대학교", nameEn: "Hankuk University of Foreign Studies", aliases: ["한국외대", "HUFS"], city: "서울", type: "university", logoFile: "hankuk-foreign" },
  { id: "korea-sports",        nameKo: "한국체육대학교", nameEn: "Korea National Sport University", aliases: ["한국체대"],                city: "서울", type: "university", logoFile: "korea-sports" },
  { id: "seoul-edu",           nameKo: "서울교육대학교", nameEn: "Seoul National University of Education", aliases: ["서울교대"],       city: "서울", type: "university", logoFile: "seoul-edu" },
  { id: "seongkonghoe",        nameKo: "성공회대학교",   nameEn: "Sungkonghoe University",          aliases: ["성공회대"],                city: "서울", type: "university", logoFile: "seongkonghoe" },
  { id: "sahmyook",            nameKo: "삼육대학교",     nameEn: "Sahmyook University",             aliases: ["삼육대"],                  city: "서울", type: "university", logoFile: "sahmyook" },
  { id: "chongshin",           nameKo: "총신대학교",     nameEn: "Chongshin University",            aliases: ["총신대"],                  city: "서울", type: "university", logoFile: "chongshin" },
  { id: "seoul-christian",     nameKo: "서울기독대학교", nameEn: "Seoul Christian University",      aliases: ["서울기독대"],              city: "서울", type: "university", logoFile: "seoul-christian" },
  { id: "seoul-hanyang",       nameKo: "서울한영대학교", nameEn: "Seoul Hanyoung University",       aliases: ["서울한영대"],              city: "서울", type: "university", logoFile: "seoul-hanyoung" },
  { id: "chugye",              nameKo: "추계예술대학교", nameEn: "Chugye University for the Arts",  aliases: ["추계예대"],                city: "서울", type: "university", logoFile: "chugye" },
  { id: "kyonggi",             nameKo: "경기대학교",     nameEn: "Kyonggi University",              aliases: ["경기대"],                  city: "서울", type: "university", logoFile: "kyonggi" },
  { id: "hoseo",               nameKo: "호서대학교",     nameEn: "Hoseo University",                aliases: ["호서대"],                  city: "서울", type: "university", logoFile: "hoseo" },

  // ── 부산 ──────────────────────────────────────────────────────────────────
  { id: "pusan-national",      nameKo: "부산대학교",     nameEn: "Pusan National University",       aliases: ["부산대", "PNU"],           city: "부산", type: "university", logoFile: "pusan-national" },
  { id: "pukyong-national",    nameKo: "부경대학교",     nameEn: "Pukyong National University",     aliases: ["부경대", "PKNU"],          city: "부산", type: "university", logoFile: "pukyong-national" },
  { id: "bufs",                nameKo: "부산외국어대학교", nameEn: "Busan University of Foreign Studies", aliases: ["부산외대", "BUFS"],  city: "부산", type: "university", logoFile: "bufs" },
  { id: "dong-a",              nameKo: "동아대학교",     nameEn: "Dong-A University",               aliases: ["동아대"],                  city: "부산", type: "university", logoFile: "dong-a" },
  { id: "donga-language",      nameKo: "동의대학교",     nameEn: "Dong-Eui University",             aliases: ["동의대"],                  city: "부산", type: "university", logoFile: "dong-eui" },
  { id: "dongseo",             nameKo: "동서대학교",     nameEn: "Dongseo University",              aliases: ["동서대"],                  city: "부산", type: "university", logoFile: "dongseo" },
  { id: "dongmyung",           nameKo: "동명대학교",     nameEn: "Tongmyong University",            aliases: ["동명대"],                  city: "부산", type: "university", logoFile: "dongmyung" },
  { id: "kyungsung",           nameKo: "경성대학교",     nameEn: "Kyungsung University",            aliases: ["경성대"],                  city: "부산", type: "university", logoFile: "kyungsung" },
  { id: "silla",               nameKo: "신라대학교",     nameEn: "Silla University",                aliases: ["신라대"],                  city: "부산", type: "university", logoFile: "silla" },
  { id: "inje",                nameKo: "인제대학교",     nameEn: "Inje University",                 aliases: ["인제대"],                  city: "부산", type: "university", logoFile: "inje" },
  { id: "youngsan",            nameKo: "영산대학교",     nameEn: "Youngsan University",             aliases: ["영산대"],                  city: "부산", type: "university", logoFile: "youngsan" },
  { id: "busan-catholic",      nameKo: "부산가톨릭대학교", nameEn: "Catholic University of Pusan",  aliases: ["부산가톨릭대"],            city: "부산", type: "university", logoFile: "busan-catholic" },
  { id: "busan-edu",           nameKo: "부산교육대학교", nameEn: "Busan National University of Education", aliases: ["부산교대"],       city: "부산", type: "university", logoFile: "busan-edu" },
  { id: "kosin",               nameKo: "고신대학교",     nameEn: "Kosin University",                aliases: ["고신대"],                  city: "부산", type: "university", logoFile: "kosin" },
  { id: "kmou",                nameKo: "한국해양대학교", nameEn: "Korea Maritime and Ocean University", aliases: ["한국해양대", "KMOU"], city: "부산", type: "university", logoFile: "kmou" },
];

export const KNOWLEDGE_CATEGORY_LABEL: Record<KnowledgeCategory, string> = {
  orientation: "입학·오리엔테이션",
  academic: "외국인 학사",
  "living-tips": "한국 생활 팁",
  admin: "행정·체류",
  learned: "이용 중 학습",
};

export function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function getInstitution(id: string): InstitutionSeed | undefined {
  return INSTITUTION_CATALOG.find((row) => row.id === id);
}

/** ASCII slug for /campus/{slug} and /admin/{slug}. Korean names stay aliases only. */
const PUBLIC_SLUG_BY_ID: Record<string, string> = {
  "korea-university": "korea-univ",
  "pusan-national": "pusan-univ",
};

export function publicSlugOf(row: InstitutionSeed): string {
  return PUBLIC_SLUG_BY_ID[row.id] ?? row.id;
}

export function campusSlugOf(row: InstitutionSeed): string {
  return publicSlugOf(row);
}

export function campusPath(row: InstitutionSeed): string {
  return `/campus/${campusSlugOf(row)}`;
}

export function findInstitutionBySlug(slug: string): InstitutionSeed | undefined {
  const key = decodeURIComponent(slug).trim().toLowerCase();
  if (!key) return undefined;
  return INSTITUTION_CATALOG.find((row) => {
    const keys = [
      publicSlugOf(row),
      row.id,
      row.logoFile ?? "",
      row.nameKo,
      row.nameEn,
      ...row.aliases,
    ].map((value) => value.toLowerCase());
    return keys.includes(key);
  });
}

export function organizationSlugOf(row: InstitutionSeed): string {
  return publicSlugOf(row);
}

export function findInstitutionByOrgSlug(slug: string): InstitutionSeed | undefined {
  const key = decodeURIComponent(slug).trim().toLowerCase();
  if (!key) return undefined;
  return INSTITUTION_CATALOG.find(
    (row) => publicSlugOf(row) === key || row.id.toLowerCase() === key,
  );
}

export function institutionAdminPath(row: InstitutionSeed, suffix = ""): string {
  const base = `/admin/${organizationSlugOf(row)}`;
  return suffix ? `${base}${suffix}` : base;
}
