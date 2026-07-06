"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

import { ko, type TranslationKey } from "./ko";
import { en } from "./en";
import { ja } from "./ja";
import { vi } from "./vi";
import { zh } from "./zh";

export type { TranslationKey };

export type Language = "ko" | "en" | "ja" | "vi" | "zh" | "custom";

export const SUPPORTED_LANGUAGES: Language[] = ["ko", "en", "ja", "vi", "zh", "custom"];

export const LANGUAGE_LABELS: Record<Exclude<Language, "custom">, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  vi: "Tiếng Việt",
  zh: "中文",
};

const STORAGE_KEY = "nuami-lang";
const CUSTOM_LANG_KEY = "nuami-custom-lang-label";

const DICTS = { ko, en, ja, vi, zh } as const;

type DictLang = keyof typeof DICTS;

function readCustomLabel(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(CUSTOM_LANG_KEY)?.trim() ?? "";
}

function readStoredLang(): Language {
  if (typeof window === "undefined") return "ko";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && (SUPPORTED_LANGUAGES as string[]).includes(saved)) return saved;
    const browser = navigator.language.split("-")[0];
    if ((SUPPORTED_LANGUAGES as string[]).includes(browser)) return browser as Language;
  } catch {
    /* ignore */
  }
  return "ko";
}

export function getUserLanguageCode(lang: Language): string {
  if (lang === "custom") {
    const custom = readCustomLabel();
    return custom || "en";
  }
  return lang;
}

function resolveDictLang(lang: Language): DictLang {
  if (lang === "custom") return "en";
  if (lang in DICTS) return lang as DictLang;
  return "en";
}

interface LanguageContextValue {
  lang: Language;
  customLangLabel: string;
  setLang: (l: Language) => void;
  setCustomLangLabel: (label: string) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(readStoredLang);
  const [customLangLabel, setCustomLangLabelState] = useState(readCustomLabel);

  useEffect(() => {
    setCustomLangLabelState(readCustomLabel());
    setLangState(readStoredLang());
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const setCustomLangLabel = useCallback((label: string) => {
    const trimmed = label.trim();
    setCustomLangLabelState(trimmed);
    localStorage.setItem(CUSTOM_LANG_KEY, trimmed);
    setLang("custom");
  }, [setLang]);

  const dictLang = resolveDictLang(lang);
  const t = useCallback(
    (key: TranslationKey): string =>
      (DICTS[dictLang][key] as string) ?? (DICTS.en[key] as string) ?? (DICTS.ko[key] as string) ?? key,
    [dictLang],
  );

  return (
    <LanguageContext.Provider value={{ lang, customLangLabel, setLang, setCustomLangLabel, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
