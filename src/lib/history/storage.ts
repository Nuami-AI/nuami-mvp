"use client";

import { VIDEO_RESEARCH_TOPICS } from "@/lib/shopping/video-research";
import type { ExtractionResult } from "@/types/extraction";
import type { HistoryLinkListEntry, HistorySummaryEntry } from "@/types/history";
import type { SavedItem } from "@/types/saves";

const STORAGE_KEY = "nuami_history_v1";
const VIDEO_LINKS_KEY = "nuami-video-links";
const SAVES_KEY = "nuami_saves_v1";
const SEED_KEY = "nuami_history_seeded_v1";
const MAX_SUMMARIES = 50;

function now(): string {
  return new Date().toISOString();
}

function loadSummariesRaw(): HistorySummaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistorySummaryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSummaries(entries: HistorySummaryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_SUMMARIES)));
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `youtube:${id}` : url.trim();
    }
    const v = u.searchParams.get("v");
    if (v) return `youtube:${v}`;
    return url.trim().toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function listSummaryHistory(): HistorySummaryEntry[] {
  seedHistoryFromSaves();
  return loadSummariesRaw().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function seedHistoryFromSaves(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;

  try {
    const raw = localStorage.getItem(SAVES_KEY);
    if (raw) {
      const saves = JSON.parse(raw) as SavedItem[];
      for (const item of saves) {
        if (item.type !== "guide" || !item.payload?.situation || !item.payload?.video) continue;
        addSummaryHistory({
          situation: item.situation ?? item.title,
          sourceUrl: item.sourceUrl,
          data: item.payload as ExtractionResult,
        });
      }
    }
    localStorage.setItem(SEED_KEY, "1");
  } catch {
    localStorage.setItem(SEED_KEY, "1");
  }
}

export function getSummaryHistory(id: string): HistorySummaryEntry | undefined {
  return loadSummariesRaw().find((e) => e.id === id);
}

export function findSummaryBySource(
  sourceUrl: string | undefined,
  situation: string,
): HistorySummaryEntry | undefined {
  const entries = listSummaryHistory();
  if (sourceUrl?.trim()) {
    const key = normalizeUrl(sourceUrl);
    const byUrl = entries.find((e) => e.sourceUrl && normalizeUrl(e.sourceUrl) === key);
    if (byUrl) return byUrl;
  }
  const trimmed = situation.trim();
  return entries.find((e) => !e.sourceUrl && e.situation.trim() === trimmed);
}

export function addSummaryHistory(input: {
  situation: string;
  sourceUrl?: string;
  data: ExtractionResult;
}): HistorySummaryEntry {
  const ts = now();
  const entries = loadSummariesRaw();
  const preview = input.data.situation.summary.trim().slice(0, 120);
  const videoTitle = input.data.video.title || input.situation;
  const videoChannel = input.data.video.channel;

  let existingIdx = -1;
  if (input.sourceUrl?.trim()) {
    const key = normalizeUrl(input.sourceUrl);
    existingIdx = entries.findIndex(
      (e) => e.sourceUrl && normalizeUrl(e.sourceUrl) === key,
    );
  } else {
    existingIdx = entries.findIndex(
      (e) => !e.sourceUrl && e.situation.trim() === input.situation.trim(),
    );
  }

  if (existingIdx >= 0) {
    const updated: HistorySummaryEntry = {
      ...entries[existingIdx],
      situation: input.situation.trim(),
      sourceUrl: input.sourceUrl?.trim() || undefined,
      videoTitle,
      videoChannel,
      summaryPreview: preview,
      data: input.data,
      updatedAt: ts,
    };
    const next = [updated, ...entries.filter((_, i) => i !== existingIdx)];
    persistSummaries(next);
    return updated;
  }

  const created: HistorySummaryEntry = {
    id: crypto.randomUUID(),
    kind: "summary",
    situation: input.situation.trim(),
    sourceUrl: input.sourceUrl?.trim() || undefined,
    videoTitle,
    videoChannel,
    summaryPreview: preview,
    data: input.data,
    createdAt: ts,
    updatedAt: ts,
  };
  persistSummaries([created, ...entries]);
  return created;
}

export function removeSummaryHistory(id: string): void {
  persistSummaries(loadSummariesRaw().filter((e) => e.id !== id));
}

export function removeSummaryHistoryMany(ids: string[]): void {
  const idSet = new Set(ids);
  persistSummaries(loadSummariesRaw().filter((e) => !idSet.has(e.id)));
}

export function clearSummaryHistory(): void {
  persistSummaries([]);
}

export function loadLinkListHistory(): HistoryLinkListEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VIDEO_LINKS_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, string[]>;
    const entries: HistoryLinkListEntry[] = [];

    for (const topic of VIDEO_RESEARCH_TOPICS) {
      const links = (all[topic.id] ?? []).map((l) => l.trim()).filter(Boolean);
      if (links.length === 0) continue;
      entries.push({
        id: `links-${topic.id}`,
        kind: "link_list",
        topicId: topic.id,
        topicTitle: topic.title,
        topicEmoji: topic.emoji,
        situation: topic.defaultSituation,
        links,
        updatedAt: now(),
      });
    }

    return entries;
  } catch {
    return [];
  }
}

export function formatHistoryDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
