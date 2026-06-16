"use client";

import Link from "next/link";
import { VIDEO_RESEARCH_TOPICS } from "@/lib/shopping/video-research";

interface Props {
  situation: string;
}

export default function VideoResearchPrompts({ situation }: Props) {
  return (
    <section className="mt-6">
      <div className="mb-3">
        <h3 className="text-[15px] font-bold text-text-primary">동영상으로 확인해보세요</h3>
        <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">
          뉴아미 <span className="font-semibold text-accent-700">동영상 링크 요약</span>으로 세일·유행·메이크업 정보를 더 깊이 정리할 수 있어요
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {VIDEO_RESEARCH_TOPICS.map((topic) => (
          <div
            key={topic.id}
            className="flex items-center gap-3 bg-white rounded-2xl border border-line-neutral p-4 shadow-sm"
          >
            <span className="text-2xl shrink-0">{topic.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-text-primary">{topic.title}</p>
              <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">{topic.description}</p>
            </div>
            <Link
              href={`/guide/video-links?topic=${topic.id}&situation=${encodeURIComponent(situation)}`}
              className="shrink-0 rounded-xl bg-accent-700 text-white text-[12px] font-semibold px-3 py-2 hover:bg-accent-800 transition-colors"
            >
              목록 만들기
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
