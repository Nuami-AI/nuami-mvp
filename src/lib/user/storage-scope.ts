"use client";

const ACTIVE_USER_KEY = "nuami_active_user";

export function getActiveUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(ACTIVE_USER_KEY)?.trim().toLowerCase();
  return value || null;
}

/** Bind browser storage (history / prefs / saves) to the signed-in email. */
export function setActiveUserEmail(email: string | null): void {
  if (typeof window === "undefined") return;
  const prev = getActiveUserEmail();
  const next = email?.trim().toLowerCase() || null;
  if (next) localStorage.setItem(ACTIVE_USER_KEY, next);
  else localStorage.removeItem(ACTIVE_USER_KEY);
  if (prev !== next) {
    window.dispatchEvent(new Event("nuami-storage-scope"));
    window.dispatchEvent(new Event("nuami-prefs"));
  }
}

export function clearActiveUserEmail(): void {
  setActiveUserEmail(null);
}

/** Per-account key. Never reuse the bare `base` — that mixes accounts on one browser. */
export function scopedStorageKey(base: string): string {
  const email = getActiveUserEmail();
  return `${base}:${email ?? "anonymous"}`;
}
