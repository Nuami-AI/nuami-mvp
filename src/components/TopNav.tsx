"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useCampusAffiliation } from "@/hooks/useCampusAffiliation";
import { useLanguage } from "@/lib/i18n";
import { clearActiveUserEmail } from "@/lib/user/storage-scope";
import type { NavTabId } from "./nav-tabs";

const BASE_LINKS: { id: NavTabId; labelKey: "nav.home" | "nav.guide" | "nav.culture" | "nav.bookmarks" | "nav.mypage"; href: string }[] = [
  { id: "home",     labelKey: "nav.home",      href: "/" },
  { id: "guide",    labelKey: "nav.guide",     href: "/guide" },
  { id: "culture",  labelKey: "nav.culture",   href: "/content" },
  { id: "bookmark", labelKey: "nav.bookmarks", href: "/saved" },
  { id: "mypage",   labelKey: "nav.mypage",    href: "/mypage" },
];

export default function TopNav({ active = "home" }: { active?: NavTabId }) {
  const { t } = useLanguage();
  const router = useRouter();
  const { universityId, navLabel, campusHref } = useCampusAffiliation();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "audience=app",
      redirect: "manual",
    }).catch(() => {});
    clearActiveUserEmail();
    router.push("/login");
  }

  const links = universityId && navLabel
    ? [
        BASE_LINKS[0],
        { id: "campus" as const, href: campusHref, label: navLabel },
        ...BASE_LINKS.slice(1),
      ]
    : BASE_LINKS;

  return (
    <nav className="hidden md:flex w-full bg-background border-b border-line-neutral sticky top-0 z-20">
      <div className="w-full max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <BrandLogo className="h-8" />
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                active === link.id
                  ? "text-text-primary bg-accent-50 font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-muted"
              }`}
            >
              {"label" in link ? link.label : t(link.labelKey)}
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
