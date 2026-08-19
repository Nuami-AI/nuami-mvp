"use client";

import Link from "next/link";
import { useCampusAffiliation } from "@/hooks/useCampusAffiliation";
import { useLanguage } from "@/lib/i18n";
import type { NavTabId } from "./nav-tabs";

const BASE_TABS: { id: NavTabId; labelKey: "nav.home" | "nav.guide" | "nav.culture" | "nav.bookmarks" | "nav.mypage"; href: string }[] = [
  { id: "home",     labelKey: "nav.home",      href: "/" },
  { id: "guide",    labelKey: "nav.guide",     href: "/guide" },
  { id: "culture",  labelKey: "nav.culture",   href: "/content" },
  { id: "bookmark", labelKey: "nav.bookmarks", href: "/saved" },
  { id: "mypage",   labelKey: "nav.mypage",    href: "/mypage" },
];

const ACTIVE_COLOR   = "#8651F2";
const INACTIVE_COLOR = "#A9A9A2";

function TabIcon({ id, active }: { id: NavTabId; active: boolean }) {
  const stroke = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  const fill   = active ? ACTIVE_COLOR : "none";

  if (id === "home")
    return (
      <svg width="20" height="20" fill={fill} stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
        <path d="M9 21V12h6v9" fill="white" />
      </svg>
    );
  if (id === "campus")
    return (
      <svg width="20" height="20" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 10 12 4l9 6" />
        <path d="M5 10v8h14v-8" />
        <path d="M9 18v-5h6v5" fill={active ? "#F2EBFF" : "none"} />
      </svg>
    );
  if (id === "guide")
    return (
      <svg width="20" height="20" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <rect x="4" y="3" width="16" height="18" rx="2" fill={active ? "#F2EBFF" : "none"} stroke={stroke} />
        <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
      </svg>
    );
  if (id === "culture")
    return (
      <svg width="20" height="20" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3"  y="3"  width="7" height="7" rx="1.5" />
        <rect x="14" y="3"  width="7" height="7" rx="1.5" />
        <rect x="3"  y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  if (id === "bookmark")
    return (
      <svg width="20" height="20" fill={fill} stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    );
  if (id === "mypage")
    return (
      <svg width="20" height="20" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
      </svg>
    );
  return null;
}

export default function BottomNav({ active = "home" }: { active?: NavTabId }) {
  const { t } = useLanguage();
  const { universityId, navLabel, campusHref } = useCampusAffiliation();

  const tabs = universityId && navLabel
    ? [
        BASE_TABS[0],
        { id: "campus" as const, href: campusHref, label: navLabel },
        ...BASE_TABS.slice(1),
      ]
    : BASE_TABS;

  return (
    <nav className="fixed bottom-0 left-0 z-30 flex w-full border-t border-line-neutral bg-background md:hidden">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex-1 flex flex-col items-center pt-2 pb-3 gap-0.5 text-[10px] font-medium min-w-0 ${
              isActive ? "text-accent-700" : "text-text-disabled"
            }`}
          >
            <TabIcon id={tab.id} active={isActive} />
            <span className="truncate max-w-full px-0.5">
              {"label" in tab ? tab.label : t(tab.labelKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
