"use client";

import { useEffect, useMemo, useState } from "react";

import { AdaptActionCard } from "@/components/guide/AdaptActionCard";
import { useLanguage } from "@/lib/i18n";
import {
  COMMON_ADAPT_SECTIONS,
  type GuideCard,
  type GuideSection,
} from "@/lib/guide/adapt-cards";
import type { CampusTheme } from "@/lib/institution/campus-theme";
import { scopedStorageKey } from "@/lib/user/storage-scope";

const LEGACY_DONE_KEY = "nuami-guide-done";
const LEGACY_BONUS_KEY = "nuami-guide-bonus-claimed";

function doneKey(universityId: string) {
  return scopedStorageKey(`nuami-campus-done:${universityId}`);
}
function bonusKey(universityId: string) {
  return scopedStorageKey(`nuami-campus-bonus:${universityId}`);
}

function loadSet(key: string, fallbackKey?: string): Set<string> {
  try {
    const raw = localStorage.getItem(key) ?? (fallbackKey ? localStorage.getItem(fallbackKey) : null);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveSet(key: string, value: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...value]));
  } catch {
    /* ignore */
  }
}

export default function CampusAdaptTrack({
  universityId,
  campusName,
  colors,
  officialSection,
  commonSections = COMMON_ADAPT_SECTIONS,
  matches,
  onGenerateAnyway,
  generating,
}: {
  universityId: string;
  campusName: string;
  colors: CampusTheme;
  officialSection: GuideSection | null;
  commonSections?: GuideSection[];
  matches: GuideCard[];
  onGenerateAnyway: () => void;
  generating: boolean;
}) {
  const { t } = useLanguage();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");

  const trackSections = useMemo(() => {
    return officialSection ? [officialSection, ...commonSections] : commonSections;
  }, [officialSection, commonSections]);

  const allIds = useMemo(
    () => trackSections.flatMap((section) => section.cards.map((card) => card.id)),
    [trackSections],
  );

  useEffect(() => {
    setDone(loadSet(doneKey(universityId), LEGACY_DONE_KEY));
    try {
      setBonusClaimed(
        localStorage.getItem(bonusKey(universityId)) === "1" || localStorage.getItem(LEGACY_BONUS_KEY) === "1",
      );
    } catch {
      setBonusClaimed(false);
    }
    setMounted(true);
  }, [universityId]);

  function toggleDone(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveSet(doneKey(universityId), next);
      return next;
    });
  }

  async function claimBonus() {
    setClaiming(true);
    setClaimError("");
    try {
      const res = await fetch("/api/guide/claim-bonus", { method: "POST" });
      if (res.status === 409) {
        setBonusClaimed(true);
        localStorage.setItem(bonusKey(universityId), "1");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error === "UNAUTHORIZED" ? t("adapt.error.login") : t("adapt.error.server"));
      }
      setBonusClaimed(true);
      localStorage.setItem(bonusKey(universityId), "1");
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : t("adapt.error.server"));
    } finally {
      setClaiming(false);
    }
  }

  const doneCount = [...done].filter((id) => allIds.includes(id)).length;
  const total = allIds.length;
  const allDone = total > 0 && doneCount === total;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const focusId = matches[0]?.id;

  return (
    <div className="space-y-5">
      {mounted ? (
        <div
          className="rounded-2xl border px-5 py-4"
          style={{
            borderColor: allDone ? colors.primary : undefined,
            backgroundColor: allDone ? colors.soft : undefined,
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-text-primary">
                {allDone ? t("adapt.progress.done") : t("campus.adapt.progress").replace("{name}", campusName)}
              </p>
              {!allDone ? <p className="mt-0.5 text-[11px] text-text-tertiary">{t("campus.adapt.progressHint")}</p> : null}
            </div>
            <div className="text-right">
              <span className="text-[22px] font-extrabold tabular-nums text-text-primary">{doneCount}</span>
              <span className="text-[13px] text-text-tertiary">/{total}</span>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: colors.primary }}
            />
          </div>
          {doneCount > 0 && !allDone ? (
            <p className="mt-2 text-[11px] font-medium" style={{ color: colors.primary }}>
              {t("adapt.progress.partial").replace("{pct}", String(pct))}
            </p>
          ) : null}
        </div>
      ) : null}

      {matches.length > 0 ? (
        <div className="rounded-2xl border border-line-normal bg-white px-4 py-4">
          <p className="text-[13px] font-bold text-text-primary">{t("campus.adapt.matchTitle")}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">{t("campus.adapt.matchHint")}</p>
          <div className="mt-3 flex flex-col gap-2">
            {matches.map((card) => (
              <a
                key={card.id}
                href={`#card-${card.id}`}
                className="flex items-center justify-between rounded-xl border border-line-neutral px-3 py-2.5 text-left"
              >
                <span className="text-[13px] font-semibold text-text-primary">
                  {card.emoji} {card.title}
                </span>
                {card.badge ? (
                  <span className="text-[10px] font-semibold text-text-secondary">
                    {card.badge}
                  </span>
                ) : null}
              </a>
            ))}
          </div>
          <button
            type="button"
            disabled={generating}
            onClick={onGenerateAnyway}
            className="mt-3 w-full rounded-xl border py-2.5 text-[13px] font-semibold disabled:opacity-50"
            style={{ borderColor: colors.primary, color: colors.primary }}
          >
            {t("campus.adapt.generateAnyway")}
          </button>
        </div>
      ) : null}

      <div className="flex w-max max-w-full gap-2 overflow-x-auto pb-1">
        {trackSections.map((section) => {
          const sectionDone = mounted ? section.cards.filter((card) => done.has(card.id)).length : 0;
          return (
            <a
              key={section.id}
              href={`#section-${section.id}`}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium ${section.bgClass} ${section.textClass}`}
            >
              {section.id === "campus-official" ? campusName : section.label}
              {mounted && sectionDone > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    sectionDone === section.cards.length
                      ? "bg-status-done-solid text-white"
                      : "bg-white text-text-secondary"
                  }`}
                >
                  {sectionDone}/{section.cards.length}
                </span>
              ) : null}
            </a>
          );
        })}
      </div>

      <div className="flex flex-col gap-8">
        {trackSections.map((section) => (
          <section key={section.id} id={`section-${section.id}`} className="scroll-mt-4">
            <div className="mb-3 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${section.bgClass} ${section.textClass}`}>
                {section.id === "campus-official"
                  ? t("campus.adapt.official").replace("{name}", campusName)
                  : section.label}
              </span>
              <span className="text-[12px] text-text-disabled">
                {t("campus.adapt.situations").replace("{n}", String(section.cards.length))}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {section.cards.map((card) => (
                <AdaptActionCard
                  key={card.id}
                  card={card}
                  done={done.has(card.id)}
                  onDone={toggleDone}
                  forceOpen={focusId === card.id}
                  checkHint={t("campus.adapt.checkHint")}
                  checkedLabel={t("campus.adapt.checked")}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {mounted && allDone ? (
        <div className="rounded-2xl border border-accent-200 bg-accent-50 px-5 py-5 text-center">
          {bonusClaimed ? (
            <>
              <p className="text-xl">🎉</p>
              <p className="mt-1 text-[14px] font-bold text-accent-800">{t("adapt.bonus.claim")}</p>
            </>
          ) : (
            <>
              <p className="text-[14px] font-bold text-accent-900">{t("adapt.bonus.title")}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-accent-700">
                {t("adapt.bonus.desc").replace("{total}", String(total))}
              </p>
              {claimError ? <p className="mt-1 text-[11px] text-red-500">{claimError}</p> : null}
              <button
                type="button"
                disabled={claiming}
                onClick={() => void claimBonus()}
                className="mt-3 w-full rounded-xl bg-accent-700 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                {claiming ? t("adapt.bonus.loading") : t("adapt.bonus.claim")}
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
