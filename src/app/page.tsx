"use client";

import { useState } from "react";
import InputScreen from "@/components/InputScreen";
import ResultsScreen from "@/components/ResultsScreen";

export default function Home() {
  const [url, setUrl] = useState("");
  const [showResults, setShowResults] = useState(false);

  if (showResults) {
    return <ResultsScreen onBack={() => setShowResults(false)} />;
  }

  return (
    <InputScreen
      url={url}
      onChange={setUrl}
      onExtract={() => setShowResults(true)}
    />
  );
}
