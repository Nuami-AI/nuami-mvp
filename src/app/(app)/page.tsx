"use client";

// Design Ref: §5.1 state machine — idle | loading | success | error.
// Plan SC: FR-05, FR-07, FR-08, FR-09

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import InputScreen from "@/components/InputScreen";
import PaywallModal from "@/components/PaywallModal";
import ResultsScreen from "@/components/ResultsScreen";
import UniversityAffiliation from "@/components/affiliation/UniversityAffiliation";
import { useLanguage, getUserLanguageCode } from "@/lib/i18n";
import { addSummaryHistory } from "@/lib/history/storage";
import { loadPreferences } from "@/lib/user/preferences";
import type { ExtractError, ExtractResponse, ExtractionResult } from "@/types/extraction";
import type { UsageInfo } from "@/types/usage";

type Status = "idle" | "loading" | "success" | "error";

function HomeContent() {
  const [situation, setSituation] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<ExtractError | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageInfo, setUsageInfo] = useState<UsageInfo>({ used: null, limit: null, remaining: null, role: null });
  const { lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoExtractStarted = useRef(false);

  useEffect(() => {
    const s = searchParams.get("situation");
    const u = searchParams.get("url");
    if (s) setSituation(s);
    if (u) setUrl(u);
  }, [searchParams]);

  const doExtract = useCallback(async (situationValue: string, urlValue: string, knowledgeId?: string) => {
    const trimmedSituation = situationValue.trim();
    const trimmedUrl = urlValue.trim();
    if (!trimmedSituation) return;

    setSituation(trimmedSituation);
    setUrl(trimmedUrl);
    setStatus("loading");
    setError(null);

    try {
      const prefs = loadPreferences();
      if (window.localStorage.getItem("nuami_last_search")) {
        fetch("/api/usage/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "guide_researched", metadata: { situation: trimmedSituation } }),
        }).catch(() => {});
      }
      window.localStorage.setItem("nuami_last_search", trimmedSituation);

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
          situation: trimmedSituation,
          url: trimmedUrl || undefined,
          userLang: getUserLanguageCode(lang),
          toneStyle: prefs.toneStyle,
          lifeStage: prefs.lifeStage,
          stayType: prefs.stayType,
          lat: coords?.lat,
          lng: coords?.lng,
          universityId: prefs.universityVerified ? prefs.universityId || undefined : undefined,
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

      setUsageInfo((prev) => ({
        ...prev,
        used: prev.used !== null ? prev.used + 1 : null,
        remaining: prev.remaining !== null ? Math.max(0, prev.remaining - 1) : null,
      }));

      setData(body.data);
      setStatus("success");
      addSummaryHistory({
        situation: trimmedSituation,
        sourceUrl: trimmedUrl || undefined,
        data: body.data,
      });
    } catch {
      setError({
        code: "INTERNAL",
        message: "Network error — please check your connection.",
        requestId: "client",
      });
      setStatus("error");
    }
  }, [lang, router]);

  useEffect(() => {
    if (searchParams.get("auto") !== "1") return;

    const s = searchParams.get("situation")?.trim() ?? "";
    const u = searchParams.get("url")?.trim() ?? "";
    if (!s || !u || autoExtractStarted.current) return;

    autoExtractStarted.current = true;

    const clean = new URLSearchParams();
    clean.set("situation", s);
    clean.set("url", u);
    router.replace(`/?${clean.toString()}`, { scroll: false });

    void doExtract(s, u);
  }, [searchParams, router, doExtract]);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => { if (d) setUsageInfo(d as UsageInfo); })
      .catch(() => {});
  }, [router]);

  const logPaywallEvent = async (action: "paywall_cta_click" | "paywall_dismiss", metadata?: object) => {
    await fetch("/api/usage/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, metadata }),
    }).catch(() => {});
  };

  const handleExtract = async () => {
    if (status === "loading") return;
    await doExtract(situation, url);
  };

  const handleBack = () => {
    setStatus("idle");
    setData(null);
    setError(null);
    setSituation("");
    setUrl("");
    router.replace("/");
  };

  const handleSubscribe = async () => {
    await logPaywallEvent("paywall_cta_click", { ctaLabel: "구독 시작하기" });
    router.push("/pricing");
  };

  const handlePaywallDismiss = async () => {
    await logPaywallEvent("paywall_dismiss");
    setShowPaywall(false);
  };

  if (status === "success" && data) {
    return (
      <ResultsScreen
        data={data}
        onBack={handleBack}
        situation={situation}
        sourceUrl={url.trim() || undefined}
      />
    );
  }

  return (
    <>
      <InputScreen
        situation={situation}
        url={url}
        onSituationChange={setSituation}
        onUrlChange={setUrl}
        onExtract={handleExtract}
        isLoading={status === "loading"}
        error={status === "error" ? error : null}
        onDismissError={() => {
          setError(null);
          setStatus("idle");
        }}
        usageInfo={usageInfo}
      />
      <UniversityAffiliation />
      {showPaywall && (
        <PaywallModal
          onSubscribe={handleSubscribe}
          onDismiss={handlePaywallDismiss}
        />
      )}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
