"use client";

export type ToneStyle = "default" | "casual" | "concise" | "expert";
export type LifeStage = "arrived" | "settling" | "established";

export interface UserPreferences {
  toneStyle: ToneStyle;
  lifeStage: LifeStage;
}

const DEFAULT: UserPreferences = { toneStyle: "default", lifeStage: "arrived" };
const STORAGE_KEY = "nuami_prefs_v1";

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) } as UserPreferences;
  } catch {
    return DEFAULT;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
