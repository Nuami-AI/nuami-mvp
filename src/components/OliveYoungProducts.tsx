"use client";

import { useEffect, useState } from "react";

import { oliveYoungProductUrl, oliveYoungSearchUrl } from "@/lib/oliveyoung/catalog";
import { useLanguage } from "@/lib/i18n";
import type { OliveYoungProduct } from "@/lib/oliveyoung/catalog";

interface Props {
  queries: string[];
}

export default function OliveYoungProducts({ queries }: Props) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<OliveYoungProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const uniqueQueries = [...new Set(queries.filter(Boolean))].slice(0, 4);

  useEffect(() => {
    if (uniqueQueries.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      uniqueQueries.map((q) =>
        fetch(`/api/oliveyoung/search?q=${encodeURIComponent(q)}&limit=2`)
          .then((r) => r.json())
          .then((d: { products?: OliveYoungProduct[] }) => d.products ?? [])
          .catch(() => [] as OliveYoungProduct[]),
      ),
    ).then((groups) => {
      if (cancelled) return;
      const seen = new Set<string>();
      const merged: OliveYoungProduct[] = [];
      for (const group of groups) {
        for (const p of group) {
          if (!seen.has(p.goodsNo)) {
            seen.add(p.goodsNo);
            merged.push(p);
          }
        }
      }
      setProducts(merged.slice(0, 8));
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [uniqueQueries.join("|")]);

  if (uniqueQueries.length === 0) return null;

  return (
    <section>
      <h3 className="text-[15px] font-bold text-text-primary mb-1">{t("oliveyoung.title")}</h3>
      <p className="text-[12px] text-text-secondary mb-3 leading-relaxed">{t("oliveyoung.desc")}</p>

      {loading ? (
        <p className="text-[12px] text-text-disabled">{t("oliveyoung.loading")}</p>
      ) : products.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {products.map((p) => (
            <a
              key={p.goodsNo}
              href={oliveYoungProductUrl(p.goodsNo)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-[140px] bg-white rounded-2xl border border-line-neutral shadow-sm overflow-hidden hover:border-accent-300 transition-colors"
            >
              <div className="h-24 bg-gradient-to-br from-pink-50 to-accent-50 flex items-center justify-center text-3xl">
                💄
              </div>
              <div className="p-2.5">
                <p className="text-[10px] text-text-disabled truncate">{p.brand}</p>
                <p className="text-[12px] font-bold text-text-primary leading-tight line-clamp-2 mt-0.5">{p.name}</p>
                <p className="text-[11px] font-bold text-accent-700 mt-1">{p.price.toLocaleString()}원</p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <a
          href={oliveYoungSearchUrl(uniqueQueries[0])}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center rounded-xl border border-line-neutral bg-white py-3 text-[13px] font-semibold text-accent-700"
        >
          {t("oliveyoung.searchOnSite")} →
        </a>
      )}

      <p className="text-[10px] text-text-disabled mt-2">{t("oliveyoung.disclaimer")}</p>
    </section>
  );
}
