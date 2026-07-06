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
  onRemove,
}: {
  item: SavedItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm p-4 ${item.checked ? "border-line-neutral opacity-60" : "border-line-neutral"}`}>
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
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-accent-700 uppercase">{item.type}</span>
              <p className={`text-[14px] font-bold text-text-primary leading-snug ${item.checked ? "line-through" : ""}`}>
                {item.title}
              </p>
              {item.body && (
                <p className={`text-[12px] text-text-secondary mt-1 leading-relaxed ${item.type === "memo" ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
                  {item.body}
                </p>
              )}
              {item.situation && item.type !== "memo" && (
                <p className="text-[11px] text-text-disabled mt-1">📍 {item.situation}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-[11px] text-text-disabled shrink-0 px-1"
            >
              {t("saved.remove")}
            </button>
          </div>
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
  const { items, toggleChecked, remove } = useSaves();

  const products = items.filter((i) => i.type === "product");
  const guides = items.filter((i) => i.type === "guide");
  const memos = items.filter((i) => i.type === "memo");
  const bookmarks = items.filter(
    (i) => i.type === "phrase" || i.type === "place",
  );
  const others = items.filter(
    (i) => i.type !== "product" && i.type !== "guide" && i.type !== "phrase" && i.type !== "place" && i.type !== "memo",
  );

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
                    <SavedRow key={item.id} item={item} onToggle={toggleChecked} onRemove={remove} />
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
                    <SavedRow key={item.id} item={item} onToggle={toggleChecked} onRemove={remove} />
                  ))}
                </div>
              </section>
            )}
            {memos.length > 0 && (
              <section>
                <h2 className="text-[14px] font-bold text-text-primary mb-3 border-l-4 border-accent-700 pl-2">
                  ✍️ {t("saved.memos")} ({memos.length})
                </h2>
                <div className="space-y-3">
                  {memos.map((item) => (
                    <SavedRow key={item.id} item={item} onToggle={toggleChecked} onRemove={remove} />
                  ))}
                </div>
              </section>
            )}
            {bookmarks.length > 0 && (
              <section>
                <h2 className="text-[14px] font-bold text-text-primary mb-3 border-l-4 border-accent-700 pl-2">
                  {t("saved.items")} ({bookmarks.length})
                </h2>
                <div className="space-y-3">
                  {bookmarks.map((item) => (
                    <SavedRow key={item.id} item={item} onToggle={toggleChecked} onRemove={remove} />
                  ))}
                </div>
              </section>
            )}
            {others.length > 0 && (
              <section>
                <h2 className="text-[14px] font-bold text-text-primary mb-3">{t("saved.other")}</h2>
                <div className="space-y-3">
                  {others.map((item) => (
                    <SavedRow key={item.id} item={item} onToggle={toggleChecked} onRemove={remove} />
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
