"use client";

import { scopedStorageKey } from "@/lib/user/storage-scope";
import type { SavedItem } from "@/types/saves";

const STORAGE_BASE = "nuami_saves_v1";

function now() {
  return new Date().toISOString();
}

function storageKey() {
  return scopedStorageKey(STORAGE_BASE);
}

function loadAll(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    return JSON.parse(raw) as SavedItem[];
  } catch {
    return [];
  }
}

function persist(items: SavedItem[]) {
  localStorage.setItem(storageKey(), JSON.stringify(items));
}

export function listSaves(): SavedItem[] {
  return loadAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSave(id: string): SavedItem | undefined {
  return loadAll().find((s) => s.id === id);
}

export function upsertSave(
  partial: Omit<SavedItem, "id" | "createdAt" | "updatedAt"> & { id?: string },
): SavedItem {
  const items = loadAll();
  const ts = now();
  const existingIdx = partial.id ? items.findIndex((s) => s.id === partial.id) : -1;

  if (existingIdx >= 0) {
    const updated: SavedItem = {
      ...items[existingIdx],
      ...partial,
      id: items[existingIdx].id,
      createdAt: items[existingIdx].createdAt,
      updatedAt: ts,
    };
    items[existingIdx] = updated;
    persist(items);
    return updated;
  }

  const created: SavedItem = {
    ...partial,
    id: partial.id ?? crypto.randomUUID(),
    createdAt: ts,
    updatedAt: ts,
  };
  persist([created, ...items]);
  return created;
}

export function updateSaveMemo(id: string, memo: string): SavedItem | null {
  const items = loadAll();
  const idx = items.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  items[idx] = { ...items[idx], memo, updatedAt: now() };
  persist(items);
  return items[idx];
}

export function toggleSaveChecked(id: string): SavedItem | null {
  const items = loadAll();
  const idx = items.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  items[idx] = { ...items[idx], checked: !items[idx].checked, updatedAt: now() };
  persist(items);
  return items[idx];
}

export function removeSave(id: string): void {
  persist(loadAll().filter((s) => s.id !== id));
}

export function findSaveByTitle(title: string, type?: SavedItem["type"]): SavedItem | undefined {
  return loadAll().find((s) => s.title === title && (!type || s.type === type));
}

export function countSaves(): number {
  return loadAll().length;
}
