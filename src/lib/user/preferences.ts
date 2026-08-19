"use client";

export type ToneStyle = "default" | "casual" | "concise" | "expert";
export type LifeStage = "arrived" | "settling" | "established";
export type StayType = "D-2" | "D-4" | "other";

export interface UserPreferences {
  toneStyle: ToneStyle;
  lifeStage: LifeStage;
  stayType: StayType;
  universityId: string | null;
  universityName: string | null;
  universityAsked: boolean;
  universityVerified: boolean;
}

const DEFAULT: UserPreferences = {
  toneStyle: "default",
  lifeStage: "arrived",
  stayType: "D-2",
  universityId: null,
  universityName: null,
  universityAsked: false,
  universityVerified: false,
};
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
  window.dispatchEvent(new Event("nuami-prefs"));
}
