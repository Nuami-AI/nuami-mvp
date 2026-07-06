"use client";

import { useEffect, useState } from "react";

import { useSaves } from "@/lib/saves/hooks";
import { useLanguage } from "@/lib/i18n";

interface Props {
  situation: string;
  sourceUrl?: string;
  videoTitle?: string;
}

export default function SessionMemoBox({ situation, sourceUrl, videoTitle }: Props) {
  const { t } = useLanguage();
  const { save, items } = useSaves();
  const existing = items.find((i) => i.type === "memo" && i.situation === situation);
  const [text, setText] = useState(existing?.body ?? "");

  useEffect(() => {
    setText(existing?.body ?? "");
  }, [existing?.body, situation]);

  function persistMemo(value: string) {
    save({
      id: existing?.id,
      type: "memo",
      title: situation,
      body: value,
      memo: "",
      checked: false,
      situation,
      sourceUrl,
      videoTitle,
    });
  }

  function handleBlur() {
    if (!text.trim() && !existing) return;
    persistMemo(text);
  }

  return (
    <div className="rounded-2xl border-2 border-accent-200 bg-gradient-to-br from-accent-50/60 to-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-accent-100">
        <span className="text-xl">✍️</span>
        <div>
          <h3 className="text-[15px] font-bold text-text-primary">{t("memo.sessionTitle")}</h3>
          <p className="text-[12px] text-text-secondary mt-0.5">{t("memo.sessionHint")}</p>
        </div>
      </div>
      <div className="p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          placeholder={t("memo.sessionPlaceholder")}
          rows={5}
          className="w-full text-[14px] text-text-primary bg-white border-2 border-line-neutral rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-accent-500 leading-relaxed"
        />
        {text.trim() && (
          <p className="text-[11px] text-text-disabled mt-2 text-right">{t("memo.autoSaved")}</p>
        )}
      </div>
    </div>
  );
}
