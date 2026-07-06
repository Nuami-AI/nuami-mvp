"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

type TabId = "home" | "guide" | "culture" | "bookmark" | "mypage";

const LINKS: { id: TabId; labelKey: "nav.home" | "nav.guide" | "nav.culture" | "nav.bookmarks" | "nav.mypage"; href: string }[] = [
  { id: "home",     labelKey: "nav.home",      href: "/" },
  { id: "guide",    labelKey: "nav.guide",     href: "/guide" },
  { id: "culture",  labelKey: "nav.culture",   href: "/content" },
  { id: "bookmark", labelKey: "nav.bookmarks", href: "/saved" },
  { id: "mypage",   labelKey: "nav.mypage",    href: "/mypage" },
];

function NuamiLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="14" fill="#8651F2" />
      <polygon points="10,8 22,14 10,20" fill="white" />
    </svg>
  );
}

export default function TopNav({ active = "home" }: { active?: TabId }) {
  const { t } = useLanguage();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  }

  return (
    <nav className="hidden md:flex w-full bg-background border-b border-line-neutral sticky top-0 z-20">
      <div className="w-full max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <NuamiLogo />
          <span className="text-[15px] font-bold text-text-primary tracking-tight">NUAMI</span>
        </Link>

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

        <button
          onClick={handleLogout}
          className="text-[12px] text-text-tertiary hover:text-text-secondary transition-colors"
        >
          {t("nav.logout")}
        </button>
      </div>
    </nav>
  );
}
