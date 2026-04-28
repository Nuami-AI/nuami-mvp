"use client";

// Design Ref: §5.3 PaywallModal — forced choice overlay, no ESC/outside-click dismiss
// Plan SC: FR-08, FR-09
import { useEffect } from "react";

interface Props {
  onSubscribe: () => void;
  onDismiss: () => void;
}

function LockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function PaywallModal({ onSubscribe, onDismiss }: Props) {
  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop — not clickable (forced choice) */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div className="relative w-full sm:max-w-sm mx-auto bg-background rounded-t-3xl sm:rounded-3xl px-6 pt-8 pb-10 shadow-xl">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-accent-100 flex items-center justify-center text-accent-700">
            <LockIcon />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-[18px] font-bold text-text-primary text-center leading-snug">
          더 보려면 구독이 필요합니다
        </h2>
        <p className="mt-2.5 text-[13px] text-text-secondary text-center leading-relaxed">
          Nuami Video AI 무료 체험 3회를 모두 사용했습니다.{"\n"}
          월 4,900원부터 시작하는 구독으로{"\n"}
          계속 이용하세요.
        </p>

        {/* CTAs */}
        <div className="mt-7 space-y-3">
          <button
            onClick={onSubscribe}
            className="w-full rounded-2xl bg-accent-700 text-white py-4 text-[15px] font-bold hover:bg-accent-800 active:scale-[0.98] transition-all"
          >
            구독 시작하기
          </button>
          <button
            onClick={onDismiss}
            className="w-full rounded-2xl bg-infoBox text-text-secondary py-4 text-[15px] font-medium hover:bg-muted active:scale-[0.98] transition-all"
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}
