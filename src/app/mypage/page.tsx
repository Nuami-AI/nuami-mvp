"use client";

import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import LanguageSelector from "./LanguageSelector";
import PreferenceSelector from "./PreferenceSelector";
import { PageHeader } from "@/components/ui/page-header";
import { useLanguage } from "@/lib/i18n";

export default function MypagePage() {
  const { t } = useLanguage();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  }

  return (
    <PageShell topNav="content" bottomNav="mypage">
      <PageHeader title={t("mypage.title")} />
      <LanguageSelector />
      <PreferenceSelector />
      <div className="px-4 py-6 mt-2">
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl border border-line-neutral text-text-secondary text-[14px] font-medium active:bg-muted transition-colors"
        >
          로그아웃
        </button>
      </div>
    </PageShell>
  );
}
