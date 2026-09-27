"use client";

import { useCallback, useEffect, useState } from "react";

import {
  listSaves,
  removeSave,
  toggleSaveChecked,
  updateSaveMemo,
  upsertSave,
} from "./storage";
import type { SavedItem } from "@/types/saves";

export function useSaves() {
  const [items, setItems] = useState<SavedItem[]>([]);

  const refresh = useCallback(() => {
    setItems(listSaves());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("nuami_saves_v1")) refresh();
    };
    const onScope = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("nuami-storage-scope", onScope);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nuami-storage-scope", onScope);
    };
  }, [refresh]);

  const save = useCallback(
    (partial: Omit<SavedItem, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
      const item = upsertSave(partial);
      refresh();
      return item;
    },
    [refresh],
  );

  const setMemo = useCallback(
    (id: string, memo: string) => {
      updateSaveMemo(id, memo);
      refresh();
    },
    [refresh],
  );

  const toggleChecked = useCallback(
    (id: string) => {
      toggleSaveChecked(id);
      refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    (id: string) => {
      removeSave(id);
      refresh();
    },
    [refresh],
  );

  return { items, save, setMemo, toggleChecked, remove, refresh };
}
