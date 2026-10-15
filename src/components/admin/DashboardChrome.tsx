"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { AdminNavGlyph, type AdminNavIcon } from "@/components/admin/nav-icons";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { StatusBubble, type StatusTone } from "@/components/ui/status-bubble";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "nuami.dashboard-nav";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: AdminNavIcon;
  active?: boolean;
}

export interface DashboardNavGroup {
  label?: string;
  items: DashboardNavItem[];
}

export interface DashboardChromeProps {
  homeHref: string;
  brand: ReactNode;
  email: string;
  roleLabel?: string;
  roleTone?: StatusTone;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  groups: DashboardNavGroup[];
  extraLinks?: Array<{ href: string; label: string }>;
  passwordHref: string;
  logoutAudience: "console" | "admin";
  sidebarCaption?: string;
  children: ReactNode;
}

export function DashboardChrome({
  homeHref,
  brand,
  email,
  roleLabel,
  roleTone = "progress",
  title,
  subtitle,
  actions,
  groups,
  extraLinks,
  passwordHref,
  logoutAudience,
  sidebarCaption,
  children,
}: DashboardChromeProps) {
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExpanded(window.localStorage.getItem(STORAGE_KEY) !== "icon");
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  useEffect(() => {
    function onResize() {
      if (window.matchMedia("(min-width: 768px)").matches) setDrawerOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function toggleNav() {
    setExpanded((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "labeled" : "icon");
      return next;
    });
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background text-[13px]">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line-normal bg-white px-4 md:px-5">
        <Link href={homeHref} className="min-w-0 shrink-0" onClick={() => setDrawerOpen(false)}>
          {brand}
        </Link>

        <div className="flex shrink-0 items-center gap-0.5">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="계정 메뉴"
              onClick={() => {
                setDrawerOpen(false);
                setMenuOpen((open) => !open);
              }}
              className="flex max-w-60 items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-infoBox"
            >
              <img
                src="/icons/profile/default.svg"
                alt=""
                width={28}
                height={28}
                className="size-7 rounded-full bg-infoBox"
              />
              <span className="hidden min-w-0 text-left md:block">
                <span className="block truncate text-[13px] font-medium text-text-primary">{email}</span>
              </span>
              <CaretIcon className={cn("shrink-0 text-text-tertiary transition-transform", menuOpen && "rotate-180")} />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+6px)] z-40 w-56 rounded-xl border border-line-normal bg-white py-2 shadow-lg"
              >
                <div className="px-3 pb-2">
                  <p className="truncate text-[13px] font-semibold text-text-primary">{email}</p>
                  {roleLabel ? (
                    <div className="mt-1.5">
                      <StatusBubble tone={roleTone}>{roleLabel}</StatusBubble>
                    </div>
                  ) : null}
                </div>
                <div className="border-t border-line-neutral py-1">
                  <Link
                    href={passwordHref}
                    role="menuitem"
                    className="block px-3 py-2 text-text-secondary hover:bg-infoBox hover:text-text-primary"
                    onClick={() => setMenuOpen(false)}
                  >
                    비밀번호 변경
                  </Link>
                  {extraLinks?.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className="block px-3 py-2 text-text-secondary hover:bg-infoBox hover:text-text-primary"
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <form action="/api/auth/logout" method="POST" className="border-t border-line-neutral pt-1">
                  <input type="hidden" name="audience" value={logoutAudience} />
                  <button
                    type="submit"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-text-secondary hover:bg-infoBox hover:text-text-primary"
                  >
                    로그아웃
                  </button>
                </form>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg text-text-primary hover:bg-infoBox md:hidden"
            aria-label={drawerOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={drawerOpen}
            onClick={() => {
              setMenuOpen(false);
              setDrawerOpen((open) => !open);
            }}
          >
            {drawerOpen ? <CloseGlyph /> : <MenuGlyph />}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-r border-line-normal bg-white transition-[width] duration-200 md:flex",
            expanded ? "w-52" : "w-14",
          )}
        >
          <NavList groups={groups} expanded={expanded} />
          <div className={cn("flex items-center border-t border-line-neutral p-2", expanded ? "gap-1" : "justify-center")}>
            {expanded ? (
              <div className="min-w-0 flex-1 px-1">
                <BrandLogo className="h-3.5 opacity-30 grayscale" />
                {sidebarCaption ? (
                  <p className="mt-1 truncate text-[11px] tabular-nums text-text-tertiary">{sidebarCaption}</p>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              onClick={toggleNav}
              aria-label={expanded ? "메뉴 접기" : "메뉴 펼치기"}
              title={expanded ? "메뉴 접기" : "메뉴 펼치기"}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-infoBox hover:text-text-primary"
            >
              <SidebarToggleIcon expanded={expanded} />
            </button>
          </div>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-auto px-4 py-5 md:px-6 md:py-6">
          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
              {subtitle ? <p className="mt-1 text-[13px] text-text-tertiary">{subtitle}</p> : null}
            </div>
            <div id="admin-shell-actions" className="shrink-0">
              {actions}
            </div>
          </div>
          {children}
        </main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            className="absolute inset-0 bg-text-primary/30"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-[min(20rem,86vw)] flex-col bg-white shadow-lg">
            <div className="flex h-14 items-center justify-between border-b border-line-normal px-4">
              <p className="text-[13px] font-semibold text-text-primary">메뉴</p>
              <button
                type="button"
                aria-label="메뉴 닫기"
                className="inline-flex size-10 items-center justify-center rounded-lg text-text-primary hover:bg-infoBox"
                onClick={() => setDrawerOpen(false)}
              >
                <CloseGlyph />
              </button>
            </div>
            <NavList groups={groups} expanded onNavigate={() => setDrawerOpen(false)} />
            <div className="border-t border-line-neutral px-4 py-3">
              <BrandLogo className="h-3.5 opacity-30 grayscale" />
              {sidebarCaption ? (
                <p className="mt-1 truncate text-[11px] tabular-nums text-text-tertiary">{sidebarCaption}</p>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function NavList({
  groups,
  expanded,
  onNavigate,
}: {
  groups: DashboardNavGroup[];
  expanded: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 py-3">
      {groups.map((group, index) => (
        <div key={group.label ?? group.items[0]?.href}>
          {index > 0 ? (
            <div
              title={group.label}
              className={cn(
                "mb-3 border-t border-line-normal",
                expanded ? "mx-2" : "mx-auto w-6",
              )}
            />
          ) : null}
          {group.label ? (
            <p
              className={cn(
                "mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary",
                expanded ? "" : "sr-only",
              )}
            >
              {group.label}
            </p>
          ) : null}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={expanded ? undefined : item.label}
                aria-current={item.active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "flex h-10 items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-700",
                  expanded ? "gap-3 px-3" : "justify-center px-0",
                  item.active
                    ? "bg-accent-50 font-semibold text-accent-700"
                    : "text-text-secondary hover:bg-infoBox hover:text-text-primary",
                )}
              >
                <AdminNavGlyph name={item.icon} />
                {expanded ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function CaretIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SidebarToggleIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      {expanded ? (
        <path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function MenuGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5 7h14a1 1 0 1 0 0-2H5a1 1 0 0 0 0 2Zm14 4H5a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2Zm0 6H5a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2Z" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
