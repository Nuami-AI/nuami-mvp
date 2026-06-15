"use client";

// Design Ref: §4.1 — LanguageContext + Provider + useLanguage hook.
// Plan SC: FR-02, FR-03, FR-05, FR-08

import { createContext, useContext, useState, useEffect } from "react";

import { ko, type TranslationKey } from "./ko";
import { en } from "./en";
import { ja } from "./ja";

export type { TranslationKey };

export type Language = "ko" | "en" | "ja";

export const SUPPORTED_LANGUAGES: Language[] = ["ko", "en", "ja"];

export const LANGUAGE_LABELS: Record<Language, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
};

const STORAGE_KEY = "nuami-lang";

const DICTS = { ko, en, ja } as const;

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Plan SC: FR-08 — SSR 초기값 항상 'ko' → hydration mismatch 방지
  const [lang, setLangState] = useState<Language>("ko");

  useEffect(() => {
    // Plan SC: FR-03 — localStorage → navigator.language → 'ko'
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && (SUPPORTED_LANGUAGES as string[]).includes(saved)) {
      setLangState(saved);
      return;
    }
    const browser = navigator.language.split("-")[0] as Language;
    if ((SUPPORTED_LANGUAGES as string[]).includes(browser)) {
      setLangState(browser);
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: TranslationKey): string =>
    (DICTS[lang][key] as string) ?? (DICTS.ko[key] as string) ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
