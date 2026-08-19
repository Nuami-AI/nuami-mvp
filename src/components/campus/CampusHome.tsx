"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import PaywallModal from "@/components/PaywallModal";
import PageShell from "@/components/PageShell";
import CampusAdaptTrack from "@/components/campus/CampusAdaptTrack";
import CampusGate from "@/components/campus/CampusGate";
import PipelineLoading from "@/components/guide/PipelineLoading";
import ResultsScreen from "@/components/ResultsScreen";
import { PageHeader } from "@/components/ui/page-header";
import { useCampusAffiliation } from "@/hooks/useCampusAffiliation";
import { addSummaryHistory } from "@/lib/history/storage";
import { useLanguage, getUserLanguageCode } from "@/lib/i18n";
import {
  commonSectionsForLang,
  matchAdaptCards,
  officialSectionFromGuides,
  type GuideCard,
  type GuideSection,
} from "@/lib/guide/adapt-cards";
import { campusPath, campusSlugOf, findInstitutionBySlug, getInstitution } from "@/lib/institution/catalog";
import { campusThemeOf } from "@/lib/institution/campus-theme";
import { loadPreferences } from "@/lib/user/preferences";
import type { ExtractError, ExtractResponse, ExtractionResult } from "@/types/extraction";

interface GuideItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  verified: boolean;
  source?: string;
  facts?: string[];
  documents?: string[];
  whereTo?: string[];
  keywords?: string[];
}

type Status = "idle" | "loading" | "success" | "error";

function campusDisplayName(
  campus: { nameKo: string; nameEn: string } | undefined,
  universityName?: string | null,
  navLabel?: string | null,
  lang?: string,
): string {
  if (lang && lang !== "ko" && campus?.nameEn) return campus.nameEn;
  return campus?.nameKo || universityName || navLabel || "";
}

export default function CampusHome({ slug }: { slug?: string }) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { ready, universityId, universityName, navLabel } = useCampusAffiliation();
  const campus = slug ? findInstitutionBySlug(slug) : universityId ? getInstitution(universityId) : undefined;
  const mine = universityId ? getInstitution(universityId) : undefined;
  const [items, setItems] = useState<GuideItem[]>([]);
  const [commonSections, setCommonSections] = useState(() => commonSectionsForLang("ko"));
  const [situation, setSituation] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<ExtractError | null>(null);
  const [matches, setMatches] = useState<GuideCard[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<"search" | "reason" | "generate">("search");

  const redirectedTo = useRef<string | null>(null);
  const loadReq = useRef(0);

  useEffect(() => {
    if (!ready) return;
    let target: string | null = null;
    if (!slug && universityId && mine) target = campusPath(mine);
    else if (slug && campus && decodeURIComponent(slug) !== campusSlugOf(campus)) {
      target = campusPath(campus);
    }
    if (!target) return;
    if (typeof window !== "undefined" && window.location.pathname === target) return;
    if (redirectedTo.current === target) return;
    redirectedTo.current = target;
    const timer = window.setTimeout(() => router.replace(target!), 0);
    return () => window.clearTimeout(timer);
  }, [ready, slug, universityId, mine, campus, router]);

  useEffect(() => {
    setCommonSections(commonSectionsForLang(getUserLanguageCode(lang)));
  }, [lang]);

  useEffect(() => {
    if (!campus || campus.id !== universityId) {
      setItems([]);
      setCommonSections(commonSectionsForLang(getUserLanguageCode(lang)));
      return;
    }
    const uiLang = getUserLanguageCode(lang);
    const reqId = ++loadReq.current;
    setCommonSections(commonSectionsForLang(uiLang));
    fetch(`/api/institutions/${campus.id}/guides?lang=${encodeURIComponent(uiLang)}`)
      .then((res) => res.json())
      .then((body: { items?: GuideItem[]; sections?: GuideSection[] }) => {
        if (reqId !== loadReq.current) return;
        setItems(body.items ?? []);
        if (body.sections?.length) setCommonSections(body.sections);
      })
      .catch(() => {});
  }, [campus?.id, universityId, lang]);

  useEffect(() => {
    if (status !== "loading") {
      setPipelineStep("search");
      return;
    }
    setPipelineStep("search");
    const t1 = window.setTimeout(() => setPipelineStep("reason"), 700);
    const t2 = window.setTimeout(() => setPipelineStep("generate"), 1600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [status]);

  const officialSection = useMemo(
    () =>
      officialSectionFromGuides(
        items,
        campusDisplayName(campus, universityName, navLabel, getUserLanguageCode(lang)),
        t("campus.verified"),
      ),
    [items, campus, universityName, navLabel, lang, t],
  );

  const allTrackCards = useMemo(
    () => [...(officialSection?.cards ?? []), ...commonSections.flatMap((section) => section.cards)],
    [officialSection, commonSections],
  );

  const doExtract = useCallback(async (situationValue: string, knowledgeId?: string) => {
    const trimmed = situationValue.trim();
    if (!trimmed) return;
    setSituation(trimmed);
    setMatches([]);
    setStatus("loading");
    setError(null);

    try {
      const prefs = loadPreferences();
      const coords = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 4000, maximumAge: 120_000 },
        );
      });

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation: trimmed,
          userLang: getUserLanguageCode(lang),
          toneStyle: prefs.toneStyle,
          lifeStage: prefs.lifeStage,
          stayType: prefs.stayType,
          lat: coords?.lat,
          lng: coords?.lng,
          universityId: prefs.universityVerified ? campus?.id || prefs.universityId || undefined : undefined,
          knowledgeId: knowledgeId || undefined,
        }),
      });

      if (res.status === 402) {
        setStatus("idle");
        setShowPaywall(true);
        return;
      }
      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const body = (await res.json()) as ExtractResponse;
      if ("error" in body) {
        setError(body.error);
        setStatus("error");
        return;
      }

      setData(body.data);
      setStatus("success");
      addSummaryHistory({ situation: trimmed, data: body.data });
    } catch {
      setError({
        code: "INTERNAL",
        message: "Network error — please check your connection.",
        requestId: "client",
      });
      setStatus("error");
    }
  }, [lang, router, campus]);

  function handleAsk() {
    const trimmed = situation.trim();
    if (!trimmed) return;
    const hits = matchAdaptCards(trimmed, allTrackCards);
    if (hits.length > 0) {
      setMatches(hits);
      setError(null);
      return;
    }
    setMatches([]);
    void doExtract(trimmed);
  }

  if (!ready) return null;

  if (slug && !campus) {
    return <CampusGate kind="unknown" mine={mine} />;
  }

  if (!universityId || !mine) {
    return <CampusGate kind="no-affiliation" target={campus} />;
  }

  if (campus && campus.id !== universityId) {
    return <CampusGate kind="other" target={campus} mine={mine} />;
  }

  if (status === "success" && data) {
    return (
      <ResultsScreen
        data={data}
        situation={situation}
        onBack={() => {
          setStatus("idle");
          setData(null);
          setError(null);
        }}
      />
    );
  }

  const name = campusDisplayName(campus, universityName, navLabel, getUserLanguageCode(lang));
  const shortName = campus?.aliases[0] ?? navLabel ?? name;
  const colors = campusThemeOf(campus ?? mine);

  return (
    <>
      <PageShell topNav="campus" bottomNav="campus">
        <PageHeader variant="top" title={shortName} />

        <div className="px-4 md:px-6 pt-5 pb-8 space-y-6">
          <section
            className="rounded-3xl px-5 py-6"
            style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-2xl bg-white/95 p-2 shadow-sm">
                <img src={colors.logoSrc} alt="" className="h-12 w-12 object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold opacity-80">{t("campus.hero.badge")}</p>
                <h1 className="mt-1 text-[22px] font-bold leading-tight">
                  {t("campus.hero.title").replace("{name}", name)}
                </h1>
                <p className="mt-2 text-[13px] leading-relaxed opacity-85">
                  {t("campus.hero.desc").replace("{name}", name)}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="relative">
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: colors.primary }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
              </div>
              <input
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAsk();
                }}
                placeholder={t("campus.ask.placeholder")}
                disabled={status === "loading"}
                className="w-full rounded-2xl border-2 bg-white py-3.5 pl-11 pr-4 text-base text-text-primary outline-none placeholder:text-text-disabled"
                style={{ borderColor: colors.soft }}
              />
            </div>
            <button
              type="button"
              disabled={!situation.trim() || status === "loading"}
              onClick={handleAsk}
              className="w-full rounded-2xl py-3 text-[14px] font-bold disabled:opacity-50"
              style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
            >
              {t("campus.ask.cta")}
            </button>
          </section>

          {status === "loading" && <PipelineLoading active={pipelineStep} t={t} />}

          {status === "error" && error && (
            <p className="rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-[13px] text-danger-800">
              {error.message}
            </p>
          )}

          <CampusAdaptTrack
            universityId={campus?.id ?? mine.id}
            campusName={name}
            colors={colors}
            officialSection={officialSection}
            commonSections={commonSections}
            matches={matches}
            generating={status === "loading"}
            onGenerateAnyway={() => {
              const knowledgeId = matches.find((card) => card.knowledgeId)?.knowledgeId;
              void doExtract(situation, knowledgeId);
            }}
          />
        </div>
      </PageShell>
      {showPaywall && (
        <PaywallModal
          onSubscribe={() => router.push("/pricing")}
          onDismiss={() => setShowPaywall(false)}
        />
      )}
    </>
  );
}
