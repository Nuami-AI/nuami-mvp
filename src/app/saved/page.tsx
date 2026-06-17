"use client";

import Link from "next/link";
import PageShell from "@/components/PageShell";
import { useSaves } from "@/lib/saves/hooks";
import { oliveYoungProductUrl, oliveYoungSearchUrl } from "@/lib/oliveyoung/catalog";
import { useLanguage } from "@/lib/i18n";
import type { SavedItem } from "@/types/saves";

function SavedRow({
  item,
  onToggle,
  onMemo,
  onRemove,
}: {
  item: SavedItem;
  onToggle: (id: string) => void;
  onMemo: (id: string, memo: string) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 ${item.checked ? "border-line-neutral opacity-60" : "border-line-neutral"}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onToggle(item.id)}
          className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center ${
            item.checked ? "bg-accent-700 border-accent-700 text-white" : "border-line-normal"
          }`}
        >
          {item.checked && (
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-semibold text-accent-700 uppercase">{item.type}</span>
              <p className={`text-[14px] font-bold text-text-primary leading-snug ${item.checked ? "line-through" : ""}`}>
                {item.title}
              </p>
              {item.body && (
                <p className="text-[12px] text-text-secondary mt-1 line-clamp-2">{item.body}</p>
              )}
              {item.situation && (
                <p className="text-[11px] text-text-disabled mt-1">📍 {item.situation}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-[11px] text-text-disabled shrink-0"
            >
              {t("saved.remove")}
            </button>
          </div>
          <textarea
            defaultValue={item.memo ?? ""}
            onBlur={(e) => onMemo(item.id, e.target.value)}
            placeholder={t("memo.placeholder")}
            rows={2}
            className="mt-2 w-full text-[12px] bg-infoBox border border-line-neutral rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-accent-200"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-accent-700"
              >
                {t("memo.openVideo")} →
              </a>
            )}
            {item.searchQuery && (
              <a
                href={item.oliveYoungGoodsNo ? oliveYoungProductUrl(item.oliveYoungGoodsNo) : oliveYoungSearchUrl(item.searchQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-pink-700"
              >
                올리브영 →
              </a>
            )}
            {item.type === "guide" && item.payload && (
              <Link href={`/?situation=${encodeURIComponent(item.situation ?? item.title)}${item.sourceUrl ? `&url=${encodeURIComponent(item.sourceUrl)}` : ""}`} className="text-[11px] font-semibold text-text-secondary">
                {t("saved.reopen")} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SavedPage() {
  const { t } = useLanguage();
  const { items, toggleChecked, setMemo, remove } = useSaves();

  const products = items.filter((i) => i.type === "product");
  const guides = items.filter((i) => i.type === "guide");
  const others = items.filter((i) => i.type !== "product" && i.type !== "guide");

  return (
    <PageShell topNav="guide" bottomNav="bookmark">
      <div className="px-4 py-5 max-w-[1200px] mx-auto pb-24">
        <h1 className="text-[20px] font-bold text-text-primary">{t("saved.title")}</h1>
        <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">{t("saved.desc")}</p>

        {items.length === 0 ? (
          <div className="mt-10 bg-infoBox rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-[14px] font-semibold text-text-primary">{t("saved.empty")}</p>
            <p className="text-[12px] text-text-secondary mt-2">{t("saved.emptyHint")}</p>
            <Link
              href="/"
              className="inline-block mt-4 rounded-xl bg-accent-700 text-white text-[13px] font-semibold px-5 py-2.5"
            >
              {t("saved.startGuide")}
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {products.length > 0 && (
              <section>
                <h2 className="text-[14px] font-bold text-text-primary mb-3">
                  {t("saved.products")} ({products.length})
                </h2>
                <div className="space-y-3">
                  {products.map((item) => (
                    <SavedRow key={item.id} item={item} onToggle={toggleChecked} onMemo={setMemo} onRemove={remove} />
                  ))}
                </div>
              </section>
            )}
            {guides.length > 0 && (
              <section>
                <h2 className="text-[14px] font-bold text-text-primary mb-3">
                  {t("saved.guides")} ({guides.length})
                </h2>
                <div className="space-y-3">
                  {guides.map((item) => (
                    <SavedRow key={item.id} item={item} onToggle={toggleChecked} onMemo={setMemo} onRemove={remove} />
                  ))}
                </div>
              </section>
            )}
            {others.length > 0 && (
              <section>
                <h2 className="text-[14px] font-bold text-text-primary mb-3">{t("saved.other")}</h2>
                <div className="space-y-3">
                  {others.map((item) => (
                    <SavedRow key={item.id} item={item} onToggle={toggleChecked} onMemo={setMemo} onRemove={remove} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
