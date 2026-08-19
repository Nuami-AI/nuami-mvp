"use client";

// 시장검증용 임시 도구: PC에서 모바일(390×844) 뷰포트로 미리보기.
// iframe 안에서는 뷰포트 폭이 390px이 되어 md:/lg: 반응형이 실제 모바일처럼 렌더된다.
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand/BrandLogo";

const STORAGE_KEY = "nuami-mobile-preview";
const FRAME_W = 390;
const FRAME_H = 844;

export default function MobilePreviewFrame({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [embedded, setEmbedded] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [url, setUrl] = useState("");
  const [frameH, setFrameH] = useState(FRAME_H);

  useEffect(() => {
    setMounted(true);
    const isEmbedded = typeof window !== "undefined" && window.self !== window.top;
    setEmbedded(isEmbedded);
    if (!isEmbedded) {
      setMobile(localStorage.getItem(STORAGE_KEY) === "1");
      setUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (embedded) return;
    const update = () => setFrameH(Math.min(FRAME_H, window.innerHeight - 140));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [embedded]);

  // iframe 내부(임베드)에서는 토글/오버레이 없이 그대로 렌더 → 모바일 뷰포트
  if (embedded) return <>{children}</>;

  function toggle() {
    setUrl(window.location.href);
    setMobile((v) => {
      const next = !v;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <>
      {children}

      {mounted && (
        <button
          type="button"
          onClick={toggle}
          className="fixed bottom-4 right-4 z-9998 flex items-center gap-2 rounded-full bg-accent-700 px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg hover:bg-accent-800 max-md:hidden"
          aria-label="모바일 미리보기 전환"
        >
          {mobile ? "🖥 PC 보기" : "📱 모바일 보기"}
        </button>
      )}

      {mounted && mobile && (
        <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center gap-4 bg-gray-900/92 p-6">
          <div className="flex items-center gap-3 text-white/90">
            <BrandLogo variant="color" className="h-6" />
            <span className="text-[13px] font-medium">모바일 미리보기 · {FRAME_W}×{FRAME_H}</span>
            <button
              type="button"
              onClick={toggle}
              className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold hover:bg-white/25"
            >
              닫기 ✕
            </button>
          </div>

          <div
            className="overflow-hidden rounded-[40px] border-10 border-black bg-black shadow-2xl"
            style={{ width: FRAME_W + 20, height: frameH + 20 }}
          >
            <iframe
              key={url}
              src={url}
              title="모바일 미리보기"
              scrolling="yes"
              className="block bg-white"
              style={{ width: FRAME_W, height: frameH, border: "none" }}
            />
          </div>

          <p className="text-[12px] text-white/60">
            PC 접속이지만 실제 모바일 레이아웃으로 표시됩니다.
          </p>
        </div>
      )}
    </>
  );
}
