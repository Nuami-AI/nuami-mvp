"use client";

// Design Ref: §5.1 state machine — idle | loading | success | error.
// Plan SC: FR-08 — replaces the `showResults` boolean with a real fetch flow.

import { useState } from "react";

import InputScreen from "@/components/InputScreen";
import ResultsScreen from "@/components/ResultsScreen";
import { useLanguage } from "@/lib/i18n";
import type { ExtractError, ExtractResponse, ExtractionResult } from "@/types/extraction";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<ExtractError | null>(null);
  const { lang } = useLanguage();

  const handleExtract = async () => {
    if (!url.trim() || status === "loading") return;

    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), userLang: lang }),
      });
      const body = (await res.json()) as ExtractResponse;

      if ("error" in body) {
        setError(body.error);
        setStatus("error");
        return;
      }

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
  };

  if (status === "success" && data) {
    return <ResultsScreen data={data} onBack={handleBack} />;
  }

  return (
    <InputScreen
      url={url}
      onChange={setUrl}
      onExtract={handleExtract}
      isLoading={status === "loading"}
      error={status === "error" ? error : null}
      onDismissError={() => {
        setError(null);
        setStatus("idle");
      }}
    />
  );
}
