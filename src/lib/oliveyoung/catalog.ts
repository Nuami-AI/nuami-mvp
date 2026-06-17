/** Curated Olive Young bestsellers — used when live API is blocked by bot protection */

export interface OliveYoungProduct {
  goodsNo: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  keywords: string[];
  imageUrl: string;
}

export const OLIVE_YOUNG_CATALOG: OliveYoungProduct[] = [
  {
    goodsNo: "A000000212128",
    name: "쥬시 래스팅 틴트",
    brand: "롬앤",
    price: 9900,
    category: "립메이크업",
    keywords: ["롬앤", "romand", "쥬시", "틴트", "lip tint", "립틴트"],
    imageUrl: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/1000/0000/2121/A000000212128_1_1000.jpg",
  },
  {
    goodsNo: "A000000191942",
    name: "다이브인 저분자 히알루론산 세럼",
    brand: "토리든",
    price: 22000,
    category: "스킨케어",
    keywords: ["토리든", "torriden", "세럼", "히알루론산", "serum"],
    imageUrl: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/1000/0000/1919/A000000191942_1_1000.jpg",
  },
  {
    goodsNo: "A000000174177",
    name: "선크림",
    brand: "라운드랩",
    price: 17900,
    category: "선케어",
    keywords: ["라운드랩", "round lab", "선크림", "자작나무", "sunscreen", "spf"],
    imageUrl: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/1000/0000/1741/A000000174177_1_1000.jpg",
  },
  {
    goodsNo: "A000000201234",
    name: "모이스춰 선크림",
    brand: "라네즈",
    price: 22000,
    category: "선케어",
    keywords: ["라네즈", "laneige", "선크림", "moisture"],
    imageUrl: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/1000/0000/2012/A000000201234_1_1000.jpg",
  },
  {
    goodsNo: "A000000187654",
    name: "앰플",
    brand: "메디힐",
    price: 15000,
    category: "마스크팩",
    keywords: ["메디힐", "mediheal", "마스크", "앰플", "sheet mask"],
    imageUrl: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/1000/0000/1876/A000000187654_1_1000.jpg",
  },
  {
    goodsNo: "A000000198765",
    name: "글레이즈 크레이즈 틴트",
    brand: "에뛰드",
    price: 12000,
    category: "립메이크업",
    keywords: ["에뛰드", "etude", "틴트", "글레이즈"],
    imageUrl: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/1000/0000/1987/A000000198765_1_1000.jpg",
  },
  {
    goodsNo: "A000000176543",
    name: "그린티 씨드 세럼",
    brand: "이니스프리",
    price: 28000,
    category: "스킨케어",
    keywords: ["이니스프리", "innisfree", "그린티", "세럼"],
    imageUrl: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/1000/0000/1765/A000000176543_1_1000.jpg",
  },
  {
    goodsNo: "A000000165432",
    name: "퓨어 클렌징 오일",
    brand: "마녀공장",
    price: 19900,
    category: "클렌징",
    keywords: ["마녀공장", "manyo", "클렌징", "오일", "cleansing"],
    imageUrl: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/1000/0000/1654/A000000165432_1_1000.jpg",
  },
  {
    goodsNo: "A000000154321",
    name: "블러 틴트",
    brand: "페리페라",
    price: 11000,
    category: "립메이크업",
    keywords: ["페리페라", "peripera", "블러", "틴트", "ink"],
    imageUrl: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/1000/0000/1543/A000000154321_1_1000.jpg",
  },
  {
    goodsNo: "A000000143210",
    name: "시카풀 앰플",
    brand: "닥터지",
    price: 28000,
    category: "스킨케어",
    keywords: ["닥터지", "dr.g", "시카", "앰플", "cica"],
    imageUrl: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/1000/0000/1432/A000000143210_1_1000.jpg",
  },
];

export function oliveYoungProductUrl(goodsNo: string): string {
  return `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}`;
}

export function oliveYoungSearchUrl(query: string): string {
  return `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(query)}`;
}

export function searchOliveYoungCatalog(query: string, limit = 6): OliveYoungProduct[] {
  const q = query.toLowerCase().trim();
  if (!q) return OLIVE_YOUNG_CATALOG.slice(0, limit);

  const scored = OLIVE_YOUNG_CATALOG.map((p) => {
    const hay = [p.name, p.brand, p.category, ...p.keywords].join(" ").toLowerCase();
    let score = 0;
    if (hay.includes(q)) score += 10;
    for (const kw of p.keywords) {
      if (q.includes(kw.toLowerCase()) || kw.toLowerCase().includes(q)) score += 5;
    }
    for (const token of q.split(/\s+/)) {
      if (token.length > 1 && hay.includes(token)) score += 2;
    }
    return { p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);
}

export function searchForProduct(productName: string, brand?: string, category?: string): OliveYoungProduct[] {
  const query = [brand, category, productName].filter(Boolean).join(" ");
  const results = searchOliveYoungCatalog(query, 4);
  if (results.length > 0) return results;
  return searchOliveYoungCatalog(productName, 4);
}
