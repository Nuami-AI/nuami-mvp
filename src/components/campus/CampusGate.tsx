"use client";

import Link from "next/link";
import Image from "next/image";

import PageShell from "@/components/PageShell";
import { PageHeader } from "@/components/ui/page-header";
import { useLanguage } from "@/lib/i18n";
import { campusPath, type InstitutionSeed } from "@/lib/institution/catalog";
import { campusThemeOf } from "@/lib/institution/campus-theme";

interface Props {
  kind: "unknown" | "no-affiliation" | "other";
  target?: InstitutionSeed;
  mine?: InstitutionSeed;
}

export default function CampusGate({ kind, target, mine }: Props) {
  const { t } = useLanguage();
  const theme = target ? campusThemeOf(target) : null;
  const mineName = mine ? mine.aliases[0] || mine.nameKo : "";
  const targetName = target ? target.aliases[0] || target.nameKo : "";

  const title =
    kind === "unknown"
      ? t("campus.gate.unknownTitle")
      : kind === "no-affiliation"
        ? t("campus.gate.noAffilTitle")
        : t("campus.gate.otherTitle").replace("{name}", targetName);

  const body =
    kind === "unknown"
      ? t("campus.gate.unknownBody")
      : kind === "no-affiliation"
        ? t("campus.gate.noAffilBody")
        : t("campus.gate.otherBody").replaceAll("{mine}", mineName).replace("{name}", targetName);

  return (
    <PageShell topNav="campus" bottomNav="campus">
      <PageHeader variant="top" title={targetName || t("campus.hero.badge")} />
      <div className="px-4 md:px-6 pt-8 pb-10">
        <section className="rounded-3xl border border-line-neutral bg-white px-5 py-8 text-center shadow-sm">
          {theme ? (
            <img
              src={theme.logoSrc}
              alt=""
              className="mx-auto h-16 w-16 object-contain"
            />
          ) : (
            <Image
              src="/brand/nami-bot.png"
              alt=""
              width={80}
              height={80}
              className="mx-auto h-16 w-16 object-contain"
            />
          )}
          <h1 className="mt-4 text-[18px] font-bold text-text-primary leading-snug">{title}</h1>
          <p className="mt-2 text-[14px] text-text-secondary leading-relaxed">{body}</p>

          <div className="mt-6 flex flex-col gap-2">
            {kind === "other" && mine ? (
              <Link
                href={campusPath(mine)}
                className="rounded-2xl py-3 text-[14px] font-bold text-white"
                style={{ backgroundColor: campusThemeOf(mine).primary }}
              >
                {t("campus.gate.otherCta").replace("{mine}", mineName)}
              </Link>
            ) : null}
            {kind === "no-affiliation" ? (
              <Link
                href="/mypage"
                className="rounded-2xl bg-accent-700 py-3 text-[14px] font-bold text-white"
              >
                {t("campus.gate.noAffilCta")}
              </Link>
            ) : null}
            <Link
              href="/"
              className="rounded-2xl border border-line-neutral py-3 text-[14px] font-semibold text-text-secondary"
            >
              {t("campus.gate.homeCta")}
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
