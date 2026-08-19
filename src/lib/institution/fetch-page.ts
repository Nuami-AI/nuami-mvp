import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 6;
const MAX_CHARS = 24_000;
const LEARNER_UA = "Mozilla/5.0 (compatible; NUAMI-InstitutionLearner/1.0)";
/** 무한 크롤 방지용 상한. 배치 단위가 아니라 한 번의 백그라운드 학습에서 새로 읽는 페이지 수. */
export const MAX_CRAWL_PAGES = 80;
const MAX_CRAWL_DEPTH = 3;
const CRAWL_CONCURRENCY = 1;
const FETCH_GAP_MS = 280;

const SKIP_PATH = /\/(login|signin|signup|logout|wp-admin|wp-login|cart|checkout|search|feed|recruit|hiring)(\/|$)/i;
const SKIP_EXT = /\.(pdf|jpe?g|png|gif|svg|webp|zip|docx?|xlsx?|pptx?|mp4|mp3|css|js|woff2?|ico|xml|json)(\?|$)/i;
const SKIP_NOISE = /채용|초빙|입찰|사업자\s*선정|회의록|성료|교수초빙/;
const GUIDE_KEYWORDS = [
  "international", "foreign", "student", "visa", "dorm", "housing", "orientation",
  "admission", "scholarship", "immigration", "residence", "guide",
  "유학", "외국인", "기숙", "입학", "오리엔테이션",
  "체류", "비자", "등록증", "생활",
];

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.internal",
]);

export class UnsafeUrlError extends Error {
  constructor(message = "허용되지 않은 주소입니다.") {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

export function parsePublicHttpUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new UnsafeUrlError("올바른 URL이 아닙니다.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new UnsafeUrlError("http 또는 https 주소만 저장할 수 있습니다.");
  }
  if (parsed.username || parsed.password) {
    throw new UnsafeUrlError("인증 정보가 포함된 URL은 사용할 수 없습니다.");
  }
  return parsed;
}

class CookieJar {
  private cookies = new Map<string, string>();

  absorb(headers: Headers): void {
    const lines = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
    for (const line of lines) {
      const pair = line.split(";")[0] ?? "";
      const eq = pair.indexOf("=");
      if (eq <= 0) continue;
      this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }

  header(): string {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

function learnerHeaders(jar: CookieJar, referer?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "text/html,application/xhtml+xml,application/json,text/plain;q=0.9",
    "User-Agent": LEARNER_UA,
  };
  const cookie = jar.header();
  if (cookie) headers.Cookie = cookie;
  if (referer) headers.Referer = referer;
  return headers;
}

async function timedFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof UnsafeUrlError) throw err;
    throw new Error("페이지를 불러오지 못했습니다.");
  } finally {
    clearTimeout(timer);
  }
}

function parseMetaRefresh(html: string, base: URL): URL | null {
  const match = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"';\s]+)["']/i)
    ?? html.match(/<meta[^>]+content=["'][^"']*url=([^"';\s]+)["'][^>]*http-equiv=["']refresh["']/i);
  if (!match?.[1]) return null;
  try {
    return new URL(match[1].trim(), base);
  } catch {
    return null;
  }
}

function parseCampusHomeCheckPath(html: string): string | null {
  const match = html.match(/url\s*:\s*['"]([^'"]*(?:pnu)?DomainChk\.do)['"]/i);
  return match?.[1] ?? null;
}

async function resolveCampusHomeUrl(
  pageUrl: URL,
  html: string,
  jar: CookieJar,
  stayOnHost?: string,
): Promise<URL | null> {
  const checkPath = parseCampusHomeCheckPath(html);
  if (!checkPath) return null;
  const checkUrl = new URL(checkPath, pageUrl);
  if (stayOnHost && checkUrl.hostname.toLowerCase() !== stayOnHost.toLowerCase()) return null;
  if (checkUrl.hostname.toLowerCase() !== pageUrl.hostname.toLowerCase()) return null;
  await assertPublicHost(checkUrl);
  const response = await timedFetch(checkUrl.href, {
    method: "POST",
    redirect: "follow",
    headers: {
      ...learnerHeaders(jar, pageUrl.href),
      Accept: "application/json,text/plain,*/*",
    },
  });
  jar.absorb(response.headers);
  if (!response.ok) return null;
  const body = await response.text();
  let siteUrl = "";
  try {
    const parsed = JSON.parse(body) as { siteUrl?: unknown };
    if (typeof parsed.siteUrl === "string") siteUrl = parsed.siteUrl.trim();
  } catch {
    return null;
  }
  if (!siteUrl || siteUrl === "nonononono" || siteUrl === "undefined") return null;
  const next = new URL(siteUrl, pageUrl);
  if (stayOnHost && next.hostname.toLowerCase() !== stayOnHost.toLowerCase()) return null;
  if (next.protocol !== "https:" && next.protocol !== "http:") return null;
  return next;
}

export async function fetchOfficialPageText(rawUrl: string): Promise<{ url: string; text: string }> {
  const page = await fetchOfficialPage(rawUrl);
  if (page.text.length < 80) {
    throw new Error("페이지에서 학습할 본문을 찾지 못했습니다.");
  }
  return { url: page.url, text: page.text };
}

export async function fetchOfficialPage(
  rawUrl: string,
  options?: { stayOnHost?: string; allowShort?: boolean; jar?: CookieJar },
): Promise<{ url: string; html: string; text: string }> {
  let current = parsePublicHttpUrl(rawUrl);
  await assertPublicHost(current);
  const jar = options?.jar ?? new CookieJar();
  let referer: string | undefined;
  const seen = new Set<string>();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (seen.has(current.href)) break;
    seen.add(current.href);
    const response = await timedFetch(current.href, {
      method: "GET",
      redirect: "manual",
      headers: learnerHeaders(jar, referer),
    });
    jar.absorb(response.headers);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || hop === MAX_REDIRECTS) {
        throw new Error("페이지 리다이렉트를 따라갈 수 없습니다.");
      }
      referer = current.href;
      current = new URL(location, current);
      if (current.protocol !== "https:" && current.protocol !== "http:") {
        throw new UnsafeUrlError("허용되지 않은 리다이렉트입니다.");
      }
      if (options?.stayOnHost && current.hostname.toLowerCase() !== options.stayOnHost.toLowerCase()) {
        throw new UnsafeUrlError("등록한 사이트 밖의 주소는 따라가지 않습니다.");
      }
      await assertPublicHost(current);
      continue;
    }

    if (!response.ok) {
      throw new Error(`페이지 응답이 ${response.status} 입니다.`);
    }

    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml") &&
      !contentType.includes("text/plain")
    ) {
      throw new Error("HTML 또는 텍스트 페이지만 학습할 수 있습니다.");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      throw new Error("페이지가 너무 큽니다.");
    }
    const html = buffer.toString("utf8");
    const text = truncate(htmlToText(html));

    if (text.length < 80 || html.length < 2500) {
      const campusHome = await resolveCampusHomeUrl(current, html, jar, options?.stayOnHost ?? current.hostname);
      if (campusHome && campusHome.href !== current.href) {
        referer = current.href;
        current = campusHome;
        await assertPublicHost(current);
        continue;
      }
      const metaNext = parseMetaRefresh(html, current);
      if (metaNext && metaNext.href !== current.href) {
        if (options?.stayOnHost && metaNext.hostname.toLowerCase() !== options.stayOnHost.toLowerCase()) {
          throw new UnsafeUrlError("등록한 사이트 밖의 주소는 따라가지 않습니다.");
        }
        referer = current.href;
        current = metaNext;
        await assertPublicHost(current);
        continue;
      }
    }

    if (!options?.allowShort && text.length < 80) {
      throw new Error("페이지에서 학습할 본문을 찾지 못했습니다.");
    }
    return { url: current.href, html, text };
  }

  throw new Error("페이지를 불러오지 못했습니다.");
}

export async function crawlOfficialSite(
  seedUrl: string,
  options?: { skipUrls?: string[] },
): Promise<Array<{ url: string; text: string }>> {
  const seed = parsePublicHttpUrl(seedUrl);
  await assertPublicHost(seed);
  const host = seed.hostname.toLowerCase();
  const seedKey = canonicalize(seed);
  const jar = new CookieJar();
  const skip = new Set<string>();
  for (const raw of options?.skipUrls ?? []) {
    try {
      skip.add(canonicalize(parsePublicHttpUrl(raw)));
    } catch {
      skip.add(raw);
    }
  }
  const continuing = skip.size > 0;
  const maxDepth = continuing ? 3 : MAX_CRAWL_DEPTH;
  const maxNew = MAX_CRAWL_PAGES;

  const fetched = new Set<string>();
  const pages: Array<{ url: string; text: string; score: number }> = [];
  const queue: Array<{ url: string; depth: number }> = [];
  const queued = new Set<string>();

  function enqueue(url: string, depth: number) {
    if (queued.has(url) || fetched.has(url)) return;
    queued.add(url);
    queue.push({ url, depth });
  }

  enqueue(seedKey, 0);
  if (continuing) {
    let n = 0;
    for (const url of skip) {
      if (n >= 12) break;
      enqueue(url, 0);
      n += 1;
    }
  }

  while (queue.length > 0 && pages.length < maxNew) {
    const batch = queue.splice(0, CRAWL_CONCURRENCY);
    if (pages.length > 0 || fetched.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, FETCH_GAP_MS));
    }
    const results = await Promise.all(batch.map(async (item) => {
      if (fetched.has(item.url)) return null;
      fetched.add(item.url);
      try {
        const page = await fetchOfficialPage(item.url, { stayOnHost: host, allowShort: true, jar });
        const finalUrl = canonicalize(parsePublicHttpUrl(page.url));
        if (parsePublicHttpUrl(page.url).hostname.toLowerCase() !== host) return null;
        fetched.add(finalUrl);
        return { ...item, page, finalUrl };
      } catch (err) {
        if (item.depth === 0 && pages.length === 0) throw err;
        return null;
      }
    }));

    for (const item of results) {
      if (!item) continue;
      const alreadyLearned = skip.has(item.finalUrl);
      if (!alreadyLearned && item.page.text.length >= 80 && pages.length < maxNew) {
        pages.push({
          url: item.finalUrl,
          text: item.page.text,
          score: scorePath(parsePublicHttpUrl(item.finalUrl), seed, ""),
        });
      }
      const expand = alreadyLearned || item.depth < maxDepth;
      if (!expand) continue;
      const nextDepth = alreadyLearned ? 1 : item.depth + 1;
      const links = extractSameHostLinks(item.page.html, parsePublicHttpUrl(item.page.url), seed);
      links.sort((a, b) => b.score - a.score);
      for (const link of links.slice(0, 24)) {
        if (queue.length >= 200) break;
        enqueue(link.url, nextDepth);
      }
    }

    queue.sort((a, b) => {
      const skipPenalty = (url: string) => (skip.has(url) ? 0 : 10);
      return (
        skipPenalty(b.url) + scorePath(parsePublicHttpUrl(b.url), seed, "")
        - (skipPenalty(a.url) + scorePath(parsePublicHttpUrl(a.url), seed, ""))
      );
    });
  }

  if (continuing) {
    return pages
      .sort((a, b) => b.score - a.score)
      .map(({ url, text }) => ({ url, text }))
      .slice(0, maxNew);
  }

  pages.sort((a, b) => b.score - a.score);
  const unique: Array<{ url: string; text: string }> = [];
  const used = new Set<string>();
  const seedPage = pages.find((page) => page.url === seedKey) ?? pages[0];
  if (seedPage) {
    used.add(seedPage.url);
    unique.push({ url: seedPage.url, text: seedPage.text });
  }
  for (const page of pages) {
    if (used.has(page.url)) continue;
    used.add(page.url);
    unique.push({ url: page.url, text: page.text });
  }
  return unique.slice(0, maxNew);
}

function extractSameHostLinks(html: string, base: URL, seed: URL): Array<{ url: string; score: number }> {
  const host = seed.hostname.toLowerCase();
  const found = new Map<string, { url: string; score: number }>();
  const pattern = /<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const href = match[1]?.trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      continue;
    }
    let parsed: URL;
    try {
      parsed = new URL(href, base);
    } catch {
      continue;
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") continue;
    if (parsed.hostname.toLowerCase() !== host) continue;
    if (SKIP_EXT.test(parsed.pathname) || SKIP_PATH.test(parsed.pathname)) continue;
    const preview = `${parsed.pathname} ${htmlToText(match[2] ?? "").slice(0, 80)}`;
    if (SKIP_NOISE.test(preview)) continue;
    parsed.hash = "";
    const url = canonicalize(parsed);
    const anchor = htmlToText(match[2] ?? "").slice(0, 80);
    const score = scorePath(parsed, seed, anchor);
    const prev = found.get(url);
    if (!prev || score > prev.score) found.set(url, { url, score });
  }
  return [...found.values()];
}

function scorePath(url: URL, seed: URL, anchor: string): number {
  let score = 0;
  const seedDir = seed.pathname.replace(/\/[^/]*\.[a-z0-9]+$/i, "").replace(/\/$/, "") || "/";
  if (url.pathname === seed.pathname) score += 8;
  if (url.pathname.startsWith(seedDir === "/" ? "/" : seedDir)) score += 4;
  const hay = `${url.pathname} ${anchor}`.toLowerCase();
  if (SKIP_NOISE.test(hay)) score -= 20;
  for (const keyword of GUIDE_KEYWORDS) {
    if (hay.includes(keyword)) score += 3;
  }
  const depth = url.pathname.split("/").filter(Boolean).length;
  if (depth <= 3) score += 2;
  if (url.search) score -= 1;
  return score;
}

function canonicalize(url: URL): string {
  const next = new URL(url.href);
  next.hash = "";
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"]) {
    next.searchParams.delete(key);
  }
  if (next.pathname.length > 1 && next.pathname.endsWith("/")) {
    next.pathname = next.pathname.slice(0, -1);
  }
  return next.href;
}

async function assertPublicHost(url: URL): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || BLOCKED_HOSTS.has(host) || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new UnsafeUrlError("내부 주소는 사용할 수 없습니다.");
  }
  if (host === "0.0.0.0" || host.endsWith(".localhost")) {
    throw new UnsafeUrlError("내부 주소는 사용할 수 없습니다.");
  }

  const ipVersion = isIP(host);
  if (ipVersion === 4 && isPrivateIPv4(host)) {
    throw new UnsafeUrlError("내부 주소는 사용할 수 없습니다.");
  }
  if (ipVersion === 6 && isPrivateIPv6(host)) {
    throw new UnsafeUrlError("내부 주소는 사용할 수 없습니다.");
  }
  if (ipVersion) return;

  let records: Array<{ address: string; family: number }>;
  try {
    records = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError("주소를 확인할 수 없습니다.");
  }
  if (records.length === 0) {
    throw new UnsafeUrlError("주소를 확인할 수 없습니다.");
  }
  for (const record of records) {
    if (record.family === 4 && isPrivateIPv4(record.address)) {
      throw new UnsafeUrlError("내부 주소는 사용할 수 없습니다.");
    }
    if (record.family === 6 && isPrivateIPv6(record.address)) {
      throw new UnsafeUrlError("내부 주소는 사용할 수 없습니다.");
    }
  }
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isPrivateIPv4(mapped[1]);
  return false;
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncate(text: string): string {
  if (text.length <= MAX_CHARS) return text;
  return `${text.slice(0, MAX_CHARS)}\n\n[페이지가 길어 앞부분만 판독했습니다]`;
}
