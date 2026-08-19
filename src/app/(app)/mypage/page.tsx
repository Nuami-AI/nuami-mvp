"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import LanguageSelector from "./LanguageSelector";
import PreferenceSelector from "./PreferenceSelector";
import UniversityAffiliation from "@/components/affiliation/UniversityAffiliation";
import { PageHeader } from "@/components/ui/page-header";
import { useLanguage } from "@/lib/i18n";

export default function MypagePage() {
  const { t } = useLanguage();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "audience=app",
      redirect: "manual",
    }).catch(() => {});
    router.push("/login");
  }

  return (
    <PageShell topNav="mypage" bottomNav="mypage">
      <PageHeader variant="top" title={t("mypage.title")} />

      <LanguageSelector />
      <div className="px-4 md:px-6 mt-8">
        <UniversityAffiliation mode="settings" />
      </div>
      <PreferenceSelector />

      <div className="px-4 md:px-6 mt-8">
        <p className="text-[13px] font-semibold text-text-secondary mb-1">{t("mypage.history.title")}</p>
        <p className="text-[12px] text-text-tertiary mb-4">{t("mypage.history.desc")}</p>
        <Link
          href="/history"
          className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border border-line-normal bg-background hover:bg-muted transition-colors"
        >
          <span className="text-[14px] font-semibold text-text-primary">📋 {t("mypage.history.link")}</span>
          <span className="text-[12px] text-accent-700">→</span>
        </Link>
      </div>

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
