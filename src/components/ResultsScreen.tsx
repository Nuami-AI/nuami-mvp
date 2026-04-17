"use client";

import { useState } from "react";
import BottomNav from "./BottomNav";

interface Props {
  onBack: () => void;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const VIDEO = {
  title: "나만 믿고 따라와 Follow Me | 베트남 인플루언서 '장홍안'과 함께하는 강릉 여행",
  channel: "국가유산채널 (K-Heritage Channel)",
};

const INIT_PLACES = [
  {
    id: 1,
    name: "Ojukheon",
    nameKo: "오죽헌",
    desc: "This ancient house is an important historical landmark as the birthplace of Shin Saimdang (1504–1551) and Yulgok Yi I (1536–1584).",
    quote:
      "Ojukheon là nơi lưu giữ lịch sử của hai mẹ con Shin Saimdang và Yulgok Yi I.",
    tags: ["Historical Site", "Traditional House"],
    bookmarked: false,
  },
  {
    id: 2,
    name: "Seongyojang",
    nameKo: "강릉선교장",
    desc: "A traditional Joseon-era aristocratic estate with 99 rooms, preserved in its original form for over 300 years.",
    quote:
      "Ojukheon là nơi lưu giữ lịch sử của hai mẹ con Shin Saimdang và Yulgok Yi I.",
    tags: ["Traditional Estate", "Heritage Site"],
    bookmarked: false,
  },
];

const INIT_PHRASES = [
  { id: 1, en: "Follow me, I'll lead the way!", ko: "믿고 따라와요.", bookmarked: true },
  { id: 2, en: "Hello everyone!", ko: "안녕하세요 여러분!", bookmarked: false },
  { id: 3, en: "Let's try eating it!", ko: "먹어보세요!", bookmarked: false },
  { id: 4, en: "Let's enjoy it together!", ko: "같이 즐기자!", bookmarked: true },
  { id: 5, en: "You must try wearing Hanbok at least once.", ko: "한복은 꼭 입어봐야 해요.", bookmarked: true },
  { id: 6, en: "That's right.", ko: "그렇죠.", bookmarked: false },
  { id: 7, en: "Do you like coffee?", ko: "커피 좋아해요?", bookmarked: false },
];

const INIT_TIPS = [
  {
    id: 1,
    title: "Best time to visit Ojukheon",
    desc: "Going early in the morning is ideal to enjoy the fresh atmosphere.",
    cat: "Time",
    bookmarked: true,
  },
  {
    id: 2,
    title: "Exploring Seongyojang",
    desc: "Allocate enough time to tour the entire estate properly.",
    cat: "Time",
    bookmarked: false,
  },
  {
    id: 3,
    title: "Gangneung coffee prices",
    desc: "Coffee is very affordable, generally ranging from 5,000 to 10,000 won.",
    cat: "Price",
    bookmarked: false,
  },
  {
    id: 4,
    title: "Waiting time for meals",
    desc: "During peak hours, waits can be long — plan your arrival time accordingly.",
    cat: "Time",
    bookmarked: false,
  },
];

// ── Icons ──────────────────────────────────────────────────────────────────

function ArrowLeft() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function BookmarkBtn({ filled, onToggle }: { filled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex-shrink-0 p-0.5">
      <svg width="20" height="20" fill={filled ? "#6D28D9" : "none"} stroke={filled ? "#6D28D9" : "#D1D5DB"} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}

function SpeakerIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="15" height="15" fill="#6D28D9" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" fill="#6D28D9" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" fill="white" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" fill="#6D28D9" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg width="16" height="16" fill="#6D28D9" viewBox="0 0 24 24">
      <path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V17H9v-2.8A6 6 0 0 1 6 9a6 6 0 0 1 6-6z" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ResultsScreen({ onBack }: Props) {
  const [places, setPlaces] = useState(INIT_PLACES);
  const [phrases, setPhrases] = useState(INIT_PHRASES);
  const [tips, setTips] = useState(INIT_TIPS);

  const togglePlace = (id: number) =>
    setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, bookmarked: !p.bookmarked } : p)));
  const togglePhrase = (id: number) =>
    setPhrases((prev) => prev.map((p) => (p.id === id ? { ...p, bookmarked: !p.bookmarked } : p)));
  const toggleTip = (id: number) =>
    setTips((prev) => prev.map((t) => (t.id === id ? { ...t, bookmarked: !t.bookmarked } : t)));

  return (
    <div className="relative flex flex-col min-h-screen max-w-[390px] mx-auto bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={onBack} className="text-gray-700 p-1 -ml-1">
          <ArrowLeft />
        </button>
        <button className="flex items-center gap-1.5 text-[13px] font-medium text-gray-600 pr-1">
          <RefreshIcon />
          Re-extract
        </button>
      </div>

      {/* Scrollable content */}
      <div className="pb-24 overflow-y-auto">
        {/* Video card */}
        <div className="bg-white">
          {/* Thumbnail placeholder */}
          <div className="w-full aspect-video bg-gray-900 relative flex items-center justify-center">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <svg width="22" height="22" fill="#6D28D9" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            {/* YouTube badge */}
            <div className="absolute bottom-2 right-3 bg-red-600 rounded px-1.5 py-0.5">
              <span className="text-white text-[10px] font-bold tracking-wide">▶ YouTube</span>
            </div>
          </div>
          {/* Video info */}
          <div className="px-4 py-3">
            <p className="text-[14px] font-semibold text-gray-900 leading-snug line-clamp-2">
              {VIDEO.title}
            </p>
            <p className="text-[12px] text-gray-500 mt-1.5 flex items-center gap-1.5">
              <span className="w-4 h-4 bg-gray-200 rounded-full inline-flex items-center justify-center text-[8px]">K</span>
              {VIDEO.channel}
            </p>
          </div>
        </div>

        {/* Analysis banner */}
        <div className="mx-4 mt-3 bg-violet-50 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <div className="mt-0.5 flex-shrink-0">
            <StarIcon />
          </div>
          <p className="text-[12px] text-violet-800 leading-relaxed">
            Video &amp; subtitle analysis results,{" "}
            <span className="font-semibold">
              this content is confirmed to be about Korea.
            </span>
          </p>
        </div>

        {/* ── Places ── */}
        <section className="mt-5 px-4">
          <div className="flex items-center gap-2 mb-3">
            <PinIcon />
            <h2 className="text-[15px] font-bold text-gray-900">Places</h2>
            <span className="text-[13px] text-gray-400">({places.length})</span>
          </div>

          <div className="flex flex-col gap-3">
            {places.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[15px] font-bold text-gray-900">{p.name}</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">{p.nameKo}</p>
                  </div>
                  <BookmarkBtn filled={p.bookmarked} onToggle={() => togglePlace(p.id)} />
                </div>
                {/* Description */}
                <p className="text-[13px] text-gray-600 mt-2 leading-relaxed">{p.desc}</p>
                {/* Original quote */}
                <p className="text-[12px] text-gray-400 italic mt-2 leading-relaxed">
                  &ldquo;{p.quote}&rdquo;
                </p>
                {/* Map buttons */}
                <div className="flex items-center gap-2 mt-3">
                  <button className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-yellow-700">
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="#F59E0B">
                      <circle cx="10" cy="10" r="10" fill="#FDE68A" />
                      <text x="5" y="14" fontSize="9" fontWeight="bold" fill="#92400E">k</text>
                    </svg>
                    Kakao Map
                  </button>
                  <button className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-blue-700">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#4285F4">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    Google Maps
                  </button>
                </div>
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p.tags.map((tag) => (
                    <span key={tag} className="text-[11px] bg-gray-100 text-gray-500 rounded-full px-2.5 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Local Phrases ── */}
        <section className="mt-5 px-4">
          <div className="flex items-center gap-2 mb-3">
            <ChatIcon />
            <h2 className="text-[15px] font-bold text-gray-900">Local Phrases</h2>
            <span className="text-[13px] text-gray-400">({phrases.length})</span>
          </div>

          <div className="flex flex-col gap-3">
            {phrases.map((ph) => (
              <div key={ph.id} className="bg-white rounded-2xl px-4 pt-4 pb-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 leading-snug">
                      {ph.en}
                    </p>
                    <p className="text-[12px] text-gray-500 mt-0.5">{ph.ko}</p>
                  </div>
                  <BookmarkBtn filled={ph.bookmarked} onToggle={() => togglePhrase(ph.id)} />
                </div>
                <button className="mt-2.5 flex items-center gap-1.5 text-[12px] text-gray-500 font-medium">
                  <SpeakerIcon />
                  Listen
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Insider Tips ── */}
        <section className="mt-5 px-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <LightbulbIcon />
            <h2 className="text-[15px] font-bold text-gray-900">Insider Tips</h2>
            <span className="text-[13px] text-gray-400">({tips.length})</span>
          </div>

          <div className="flex flex-col gap-3">
            {tips.map((tip) => (
              <div key={tip.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-bold text-gray-900 flex-1 leading-snug">
                    {tip.title}
                  </p>
                  <BookmarkBtn filled={tip.bookmarked} onToggle={() => toggleTip(tip.id)} />
                </div>
                <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">{tip.desc}</p>
                <span className="inline-block mt-3 text-[11px] bg-gray-100 text-gray-500 rounded-full px-2.5 py-1">
                  {tip.cat}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav active="videoai" />
    </div>
  );
}
