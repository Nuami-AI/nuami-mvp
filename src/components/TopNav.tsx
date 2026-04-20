"use client";

// Design Ref: §5.5 — hidden md:flex 상단 네브. 데스크탑 전용.

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

type TabId = "videoai" | "content" | "saved" | "history";

const LINKS: { id: TabId; labelKey: "nav.videoai" | "nav.content" | "nav.saved" | "nav.history"; href: string }[] = [
  { id: "videoai", labelKey: "nav.videoai", href: "/" },
  { id: "content", labelKey: "nav.content", href: "/content" },
  { id: "saved",   labelKey: "nav.saved",   href: "/" },
  { id: "history", labelKey: "nav.history", href: "/" },
];

function NuamiLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="14" fill="#8651F2" />
      <polygon points="10,8 22,14 10,20" fill="white" />
    </svg>
  );
}

export default function TopNav({ active = "videoai" }: { active?: TabId }) {
  const { t } = useLanguage();

  return (
    <nav className="hidden md:flex w-full bg-background border-b border-line-neutral sticky top-0 z-20">
      <div className="w-full max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <NuamiLogo />
          <span className="text-[15px] font-bold text-text-primary tracking-tight">NUAMI</span>
        </div>

        <div className="flex items-center gap-1">
          {LINKS.map(({ id, labelKey, href }) => (
            <Link
              key={id}
              href={href}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                active === id
                  ? "text-text-primary bg-accent-50 font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-muted"
              }`}
            >
              {t(labelKey)}
            </Link>
          ))}
        </div>

        {/* 아바타 → 마이페이지 */}
        <Link href="/mypage" className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-[13px] font-semibold text-accent-700 hover:bg-accent-200 transition-colors">
          J
        </Link>
      </div>
    </nav>
  );
}
