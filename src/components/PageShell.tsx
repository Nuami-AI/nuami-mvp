"use client";

import TopNav from "./TopNav";
import BottomNav from "./BottomNav";
import type { NavTabId } from "./nav-tabs";

interface Props {
  topNav?: NavTabId;
  bottomNav?: NavTabId;
  children: React.ReactNode;
  className?: string;
}

export default function PageShell({ topNav, bottomNav, children, className = "" }: Props) {
  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      {topNav && <TopNav active={topNav} />}
      <main className={`flex-1 w-full max-w-[1200px] mx-auto pb-20 md:pb-8 ${className}`}>
        {children}
      </main>
      {bottomNav && <BottomNav active={bottomNav} />}
    </div>
  );
}
