import type { ExtractionResult } from "./extraction";

export interface HistorySummaryEntry {
  id: string;
  kind: "summary";
  situation: string;
  sourceUrl?: string;
  videoTitle: string;
  videoChannel?: string;
  summaryPreview: string;
  data: ExtractionResult;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryLinkListEntry {
  id: string;
  kind: "link_list";
  topicId: string;
  topicTitle: string;
  topicEmoji: string;
  situation: string;
  links: string[];
  updatedAt: string;
}

export type HistoryEntry = HistorySummaryEntry | HistoryLinkListEntry;
