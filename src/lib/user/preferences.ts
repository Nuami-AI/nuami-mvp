"use client";

import { scopedStorageKey } from "@/lib/user/storage-scope";

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
const STORAGE_BASE = "nuami_prefs_v1";

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(scopedStorageKey(STORAGE_BASE));
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) } as UserPreferences;
  } catch {
    return { ...DEFAULT };
  }
}

export function savePreferences(prefs: UserPreferences): void {
  localStorage.setItem(scopedStorageKey(STORAGE_BASE), JSON.stringify(prefs));
  window.dispatchEvent(new Event("nuami-prefs"));
}

/** Clear campus affiliation + bonus flags after server-side demo reset. */
export function clearUniversityClientState(): void {
  if (typeof window === "undefined") return;
  const prefs = loadPreferences();
  savePreferences({
    ...prefs,
    universityId: null,
    universityName: null,
    universityAsked: false,
    universityVerified: false,
  });

  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key === "nuami-guide-bonus-claimed" ||
      key === "nuami-campus-done" ||
      key.startsWith("nuami-campus-done:") ||
      key.startsWith("nuami-campus-bonus:")
    ) {
      toRemove.push(key);
    }
  }
  for (const key of toRemove) localStorage.removeItem(key);
  window.dispatchEvent(new Event("nuami-prefs"));
}

/** Apply server affiliation onto local prefs (source of truth = DB). */
export function applyServerAffiliation(input: {
  organizationId: string | null;
  organizationName: string | null;
}): void {
  if (typeof window === "undefined") return;
  if (!input.organizationId) {
    clearUniversityClientState();
    return;
  }
  const prefs = loadPreferences();
  savePreferences({
    ...prefs,
    universityId: input.organizationId,
    universityName: input.organizationName,
    universityAsked: true,
    universityVerified: true,
  });
}
