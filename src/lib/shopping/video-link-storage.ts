const STORAGE_KEY = "nuami-video-links";

export function loadVideoLinks(topicId: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    all[topicId] = links.map((l) => l.trim()).filter(Boolean);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
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
