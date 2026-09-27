import { scopedStorageKey } from "@/lib/user/storage-scope";

const STORAGE_BASE = "nuami-video-links";

function storageKey() {
  return scopedStorageKey(STORAGE_BASE);
}

export function loadVideoLinks(topicId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [""];
    const all = JSON.parse(raw) as Record<string, string[]>;
    const saved = (all[topicId] ?? []).map((l) => l.trim()).filter(Boolean);
    return saved.length ? [...saved, ""] : [""];
  } catch {
    return [""];
  }
}

export function saveVideoLinks(topicId: string, links: string[]): void {
  try {
    const raw = localStorage.getItem(storageKey());
    const all = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    all[topicId] = links.map((l) => l.trim()).filter(Boolean);
    localStorage.setItem(storageKey(), JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function buildExtractHomeUrl(situation: string, videoUrl: string): string {
  const params = new URLSearchParams();
  params.set("situation", situation.trim());
  params.set("url", videoUrl.trim());
  params.set("auto", "1");
  return `/?${params.toString()}`;
}
