"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import { getVideoResearchTopic, VIDEO_RESEARCH_TOPICS } from "@/lib/shopping/video-research";

const STORAGE_KEY = "nuami-video-links";

function loadSavedLinks(topic: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [""];
    const all = JSON.parse(raw) as Record<string, string[]>;
    return all[topic]?.length ? all[topic] : [""];
  } catch {
    return [""];
  }
}

function saveLinks(topic: string, links: string[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    all[topic] = links.filter((l) => l.trim());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function VideoLinksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topic") ?? "sale";
  const situationParam = searchParams.get("situation") ?? "";
  const topic = getVideoResearchTopic(topicId);
  const situation = situationParam || topic.defaultSituation;

  const [links, setLinks] = useState<string[]>([""]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLinks(loadSavedLinks(topic.id));
    setMounted(true);
  }, [topic.id]);

  function updateLink(idx: number, value: string) {
    setLinks((prev) => {
      const next = [...prev];
      next[idx] = value;
      saveLinks(topic.id, next);
      return next;
    });
  }

  function addRow() {
    setLinks((prev) => [...prev, ""]);
  }

  function removeRow(idx: number) {
    setLinks((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      saveLinks(topic.id, next);
      return next.length ? next : [""];
    });
  }

  function handleSummarize(url: string) {
    if (!url.trim()) return;
    const params = new URLSearchParams({
      situation,
      url: url.trim(),
    });
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      <TopNav active="guide" />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-6 pb-24 md:pb-8 pt-5">
        <Link href="/guide" className="text-[13px] text-text-tertiary hover:text-text-secondary">
          ← 가이드로 돌아가기
        </Link>

        <div className="mt-4">
          <span className="text-3xl">{topic.emoji}</span>
          <h1 className="text-[22px] font-extrabold text-text-primary mt-2 leading-tight">
            동영상 링크 목록 만들기
          </h1>
          <p className="text-[14px] font-semibold text-accent-700 mt-1">{topic.title}</p>
          <p className="text-[13px] text-text-secondary mt-2 leading-relaxed">{topic.description}</p>
        </div>

        <div className="mt-6 bg-infoBox rounded-2xl border border-line-neutral p-4">
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">요약 상황</p>
          <p className="text-[13px] text-text-primary leading-relaxed">{situation}</p>
        </div>

        {mounted && (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-[14px] font-bold text-text-primary">YouTube 링크 추가</p>
            {links.map((link, idx) => (
              <div key={idx} className="flex flex-col gap-2 bg-white rounded-2xl border border-line-neutral p-4 shadow-sm">
                <label className="text-[12px] font-medium text-text-tertiary">링크 {idx + 1}</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => updateLink(idx, e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full text-[13px] text-text-primary bg-background border border-line-neutral rounded-xl px-3 py-2.5 outline-none focus:border-accent-700"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSummarize(link)}
                    disabled={!link.trim()}
                    className="flex-1 rounded-xl bg-accent-700 text-white text-[13px] font-semibold py-2.5 disabled:opacity-40 hover:bg-accent-800 transition-colors"
                  >
                    뉴아미로 요약하기
                  </button>
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="rounded-xl border border-line-neutral text-text-tertiary text-[13px] px-3 py-2.5 hover:bg-infoBox"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addRow}
              className="w-full rounded-xl border-2 border-dashed border-accent-200 text-accent-700 text-[13px] font-semibold py-3 hover:bg-accent-50 transition-colors"
            >
              + 링크 추가하기
            </button>
          </div>
        )}

        <div className="mt-8">
          <p className="text-[13px] font-semibold text-text-secondary mb-3">다른 주제로 바꾸기</p>
          <div className="flex flex-wrap gap-2">
            {VIDEO_RESEARCH_TOPICS.map((t) => (
              <Link
                key={t.id}
                href={`/guide/video-links?topic=${t.id}&situation=${encodeURIComponent(situation)}`}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium border transition-colors ${
                  t.id === topic.id
                    ? "bg-accent-700 text-white border-accent-700"
                    : "bg-white text-text-secondary border-line-neutral hover:border-accent-300"
                }`}
              >
                {t.emoji} {t.title.replace("을 확인하세요", "").replace("를 확인하세요", "")}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <BottomNav active="guide" />
    </div>
  );
}

export default function VideoLinksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <VideoLinksContent />
    </Suspense>
  );
}
