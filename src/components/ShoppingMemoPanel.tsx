"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useSaves } from "@/lib/saves/hooks";
import { oliveYoungProductUrl, oliveYoungSearchUrl } from "@/lib/oliveyoung/catalog";
import { useLanguage } from "@/lib/i18n";
import type { ExtractionResult, ProductItem } from "@/types/extraction";
import { productToSaveItem } from "@/types/saves";
import type { OliveYoungProduct } from "@/lib/oliveyoung/catalog";

interface Props {
  products: ProductItem[];
  situation: string;
  sourceUrl?: string;
  videoTitle?: string;
  extraction?: ExtractionResult;
}

function OliveYoungMatch({ query }: { query: string }) {
  const [matches, setMatches] = useState<OliveYoungProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;
    setLoading(true);
    fetch(`/api/oliveyoung/search?q=${encodeURIComponent(query)}&limit=2`)
      .then((r) => r.json())
      .then((d: { products?: OliveYoungProduct[] }) => setMatches(d.products ?? []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) {
    return <p className="text-[11px] text-text-disabled mt-2">올리브영 제품 찾는 중…</p>;
  }

  if (matches.length === 0) {
    return (
      <a
        href={oliveYoungSearchUrl(query)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex mt-2 text-[11px] font-semibold text-accent-700 underline"
      >
        올리브영에서 &quot;{query}&quot; 검색 →
      </a>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {matches.map((p) => (
        <a
          key={p.goodsNo}
          href={oliveYoungProductUrl(p.goodsNo)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-xl border border-line-neutral bg-white p-2 hover:bg-accent-50 transition-colors"
        >
          <div className="w-12 h-12 rounded-lg bg-accent-50 shrink-0 overflow-hidden flex items-center justify-center text-lg">
            🧴
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-text-disabled">{p.brand}</p>
            <p className="text-[12px] font-semibold text-text-primary truncate">{p.name}</p>
            <p className="text-[11px] text-accent-700 font-bold">{p.price.toLocaleString()}원</p>
          </div>
        </a>
      ))}
    </div>
  );
}

function ProductRow({
  product,
  situation,
  sourceUrl,
  videoTitle,
}: {
  product: ProductItem;
  situation: string;
  sourceUrl?: string;
  videoTitle?: string;
}) {
  const { t } = useLanguage();
  const { save, setMemo, toggleChecked, remove, items } = useSaves();
  const title = product.brand ? `${product.brand} ${product.name}` : product.name;
  const existing = items.find((i) => i.type === "product" && i.title === title);
  const [memo, setMemoLocal] = useState(existing?.memo ?? product.memo ?? "");
  const savedId = existing?.id ?? null;
  const saved = !!existing;

  useEffect(() => {
    if (existing?.memo !== undefined) setMemoLocal(existing.memo);
  }, [existing?.memo]);

  const searchQuery = product.searchQuery ?? product.name;

  const handleSave = () => {
    save(productToSaveItem({ ...product, memo }, { situation, sourceUrl, videoTitle }));
  };

  const handleMemoBlur = () => {
    if (savedId) setMemo(savedId, memo);
  };

  return (
    <div className="bg-white rounded-2xl border border-line-neutral shadow-sm p-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => { if (savedId) toggleChecked(savedId); }}
          disabled={!saved}
          className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center ${
            saved && existing?.checked
              ? "bg-accent-700 border-accent-700 text-white"
              : "border-line-normal bg-white"
          }`}
          aria-label="check"
        >
          {saved && existing?.checked && (
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              {product.brand && (
                <p className="text-[11px] font-semibold text-accent-700">{product.brand}</p>
              )}
              <p className="text-[14px] font-bold text-text-primary leading-snug">{product.name}</p>
              {product.category && (
                <span className="inline-block mt-1 text-[10px] bg-infoBox text-text-tertiary rounded-full px-2 py-0.5">
                  {product.category}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (saved && savedId) remove(savedId);
                else handleSave();
              }}
              className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                saved
                  ? "border-accent-700 text-accent-700 bg-accent-50"
                  : "border-line-neutral text-text-secondary"
              }`}
            >
              {saved ? t("memo.saved") : t("memo.save")}
            </button>
          </div>
          {product.reason && (
            <p className="text-[12px] text-text-secondary mt-2 leading-relaxed">{product.reason}</p>
          )}
          <textarea
            value={memo}
            onChange={(e) => setMemoLocal(e.target.value)}
            onBlur={handleMemoBlur}
            placeholder={t("memo.placeholder")}
            rows={2}
            className="mt-3 w-full text-[12px] text-text-primary bg-infoBox border border-line-neutral rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-accent-200"
          />
          <OliveYoungMatch query={searchQuery} />
        </div>
      </div>
    </div>
  );
}

export default function ShoppingMemoPanel({
  products,
  situation,
  sourceUrl,
  videoTitle,
  extraction,
}: Props) {
  const { t } = useLanguage();
  const { save, items } = useSaves();
  const [guideSaved, setGuideSaved] = useState(false);

  const handleSaveGuide = () => {
    if (!extraction) return;
    save({
      type: "guide",
      title: situation,
      body: extraction.situation.summary,
      memo: "",
      checked: false,
      situation,
      sourceUrl,
      videoTitle,
      payload: extraction,
    });
    setGuideSaved(true);
  };

  const savedProductCount = items.filter((i) => i.type === "product").length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[17px] font-bold text-text-primary">{t("memo.title")}</h2>
        <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">{t("memo.desc")}</p>
      </div>

      {sourceUrl && (
        <div className="bg-infoBox rounded-xl border border-line-neutral px-3 py-2.5 flex items-center gap-2">
          <span className="text-lg">🔗</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-text-disabled">{t("memo.sourceVideo")}</p>
            <p className="text-[12px] text-text-primary truncate">{videoTitle ?? sourceUrl}</p>
          </div>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-accent-700 shrink-0"
          >
            {t("memo.open")}
          </a>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSaveGuide}
          disabled={guideSaved || !extraction}
          className="flex-1 rounded-xl border border-accent-700 bg-accent-50 text-accent-800 text-[13px] font-semibold py-2.5 disabled:opacity-50"
        >
          {guideSaved ? t("memo.guideSaved") : t("memo.saveGuide")}
        </button>
        <Link
          href="/saved"
          className="flex-1 rounded-xl border border-line-neutral bg-white text-text-primary text-[13px] font-semibold py-2.5 text-center"
        >
          {t("memo.myList")} ({savedProductCount})
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[12px] font-semibold text-text-disabled uppercase tracking-wide">
            {t("memo.productList")} ({products.length})
          </p>
          {products.map((p, idx) => (
            <ProductRow
              key={`${p.name}-${idx}`}
              product={p}
              situation={situation}
              sourceUrl={sourceUrl}
              videoTitle={videoTitle}
            />
          ))}
        </div>
      ) : (
        <div className="bg-infoBox rounded-2xl p-5 text-center">
          <p className="text-[13px] text-text-secondary">{t("memo.noProducts")}</p>
          <p className="text-[12px] text-text-tertiary mt-2">{t("memo.noProductsHint")}</p>
          <Link
            href={`/guide/video-links?topic=trend&situation=${encodeURIComponent(situation)}`}
            className="inline-block mt-3 text-[12px] font-semibold text-accent-700 underline"
          >
            {t("memo.addVideoLink")} →
          </Link>
        </div>
      )}
    </div>
  );
}
