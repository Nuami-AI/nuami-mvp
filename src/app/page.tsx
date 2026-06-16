"use client";

// Design Ref: §5.1 state machine — idle | loading | success | error.
// Plan SC: FR-05, FR-07, FR-08, FR-09

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import InputScreen from "@/components/InputScreen";
import PaywallModal from "@/components/PaywallModal";
import ResultsScreen from "@/components/ResultsScreen";
import { useLanguage } from "@/lib/i18n";
import { loadPreferences } from "@/lib/user/preferences";
import type { ExtractError, ExtractResponse, ExtractionResult } from "@/types/extraction";

type Status = "idle" | "loading" | "success" | "error";

export interface UsageInfo {
  used: number | null;
  limit: number | null;
  remaining: number | null;
  role: "admin" | "tester" | null;
}

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

  useEffect(() => {
    const s = searchParams.get("situation");
    const u = searchParams.get("url");
    if (s) setSituation(s);
    if (u) setUrl(u);
  }, [searchParams]);

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
    if (!situation.trim() || status === "loading") return;

    setStatus("loading");
    setError(null);

    try {
      const prefs = loadPreferences();
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation: situation.trim(),
          url: url.trim() || undefined,
          userLang: lang,
          toneStyle: prefs.toneStyle,
          lifeStage: prefs.lifeStage,
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
    } catch {
      setError({
        code: "INTERNAL",
        message: "Network error — please check your connection.",
        requestId: "client",
      });
      setStatus("error");
    }
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
    return <ResultsScreen data={data} onBack={handleBack} situation={situation} />;
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
