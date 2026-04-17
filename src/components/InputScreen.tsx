"use client";

import BottomNav from "./BottomNav";

interface Props {
  url: string;
  onChange: (v: string) => void;
  onExtract: () => void;
}

function SearchIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg width="18" height="18" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

function Illustration() {
  return (
    <svg width="148" height="148" viewBox="0 0 148 148" fill="none">
      {/* Globe */}
      <circle cx="64" cy="74" r="50" fill="#EDE9FE" />
      <circle cx="64" cy="74" r="50" stroke="#7C3AED" strokeWidth="2.5" fill="none" />
      <ellipse cx="64" cy="74" rx="22" ry="50" stroke="#7C3AED" strokeWidth="1.5" fill="none" />
      <line x1="14" y1="74" x2="114" y2="74" stroke="#7C3AED" strokeWidth="1.5" />
      <path d="M22 52 Q64 60 106 52" stroke="#7C3AED" strokeWidth="1.5" fill="none" />
      <path d="M22 96 Q64 88 106 96" stroke="#7C3AED" strokeWidth="1.5" fill="none" />
      {/* Video card overlay */}
      <rect x="82" y="68" width="58" height="42" rx="10" fill="#6D28D9" />
      <polygon points="100,78 100,100 120,89" fill="white" />
      {/* Chain links */}
      <rect x="72" y="102" width="24" height="12" rx="6" fill="#A78BFA" stroke="white" strokeWidth="2"
        transform="rotate(-35 84 108)" />
      <rect x="88" y="110" width="24" height="12" rx="6" fill="#A78BFA" stroke="white" strokeWidth="2"
        transform="rotate(-35 100 116)" />
    </svg>
  );
}

export default function InputScreen({ url, onChange, onExtract }: Props) {
  return (
    <div className="relative flex flex-col min-h-screen max-w-[390px] mx-auto bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <span className="text-[15px] font-bold text-gray-900">👋 Welcome, Jay!</span>
        <button className="text-gray-500 p-1">
          <SearchIcon />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 px-5 pb-44 overflow-y-auto">
        <div className="flex justify-center mt-8">
          <Illustration />
        </div>

        <h1 className="text-[21px] font-bold text-center text-gray-900 mt-5 leading-tight">
          We&apos;ll extract content from videos
        </h1>
        <p className="text-[13px] text-gray-500 text-center mt-3 leading-relaxed px-2">
          Enter YouTube·Shorts·TikTok links and subtitles to organize into
          saveable cards.
          <br />
          Local map links · local phrases · restaurants · places and more.
        </p>

        {/* URL input */}
        <div className="mt-9">
          <p className="text-[13px] font-semibold text-gray-700 mb-2">Video URL</p>
          <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-[14px] shadow-sm">
            <input
              type="url"
              value={url}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=M..."
              className="flex-1 text-[13px] text-gray-800 outline-none placeholder:text-gray-400 bg-transparent min-w-0"
            />
            {url && (
              <button onClick={() => onChange("")} className="ml-2 flex-shrink-0">
                <XCircleIcon />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CTA pinned above bottom nav */}
      <div className="fixed bottom-[56px] left-1/2 -translate-x-1/2 w-full max-w-[390px] px-4 py-3 bg-white">
        <button
          onClick={onExtract}
          className="w-full py-[15px] bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <span className="text-base">☆</span>
          Extract
        </button>
      </div>

      <BottomNav active="videoai" />
    </div>
  );
}
