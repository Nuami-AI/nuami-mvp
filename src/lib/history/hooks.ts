"use client";

import { useCallback, useEffect, useState } from "react";

import {
  listSummaryHistory,
  loadLinkListHistory,
  removeSummaryHistory,
} from "./storage";
import type { HistoryLinkListEntry, HistorySummaryEntry } from "@/types/history";

export function useHistory() {
  const [summaries, setSummaries] = useState<HistorySummaryEntry[]>([]);
  const [linkLists, setLinkLists] = useState<HistoryLinkListEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setSummaries(listSummaryHistory());
    setLinkLists(loadLinkListHistory());
  }, []);

  useEffect(() => {
    refresh();
    setMounted(true);
  }, [refresh]);

  const remove = useCallback(
    (id: string) => {
      removeSummaryHistory(id);
      refresh();
    },
    [refresh],
  );

  return { summaries, linkLists, mounted, refresh, remove };
}
