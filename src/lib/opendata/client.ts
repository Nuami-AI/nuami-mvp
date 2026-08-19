function tag(xml: string, name: string): string | undefined {
  const match = xml.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([^\\]<]*)`, "i"));
  const value = match?.[1]?.trim();
  return value || undefined;
}

export function parseDataGoKrItems(body: string): Record<string, string>[] {
  const trimmed = body.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const json = JSON.parse(trimmed) as Record<string, unknown>;
      const response = (json.response ?? json) as Record<string, unknown>;
      const bodyNode = (response.body ?? response) as Record<string, unknown>;
      const items = (bodyNode.items ?? bodyNode) as Record<string, unknown>;
      const raw = items.item ?? items;
      const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
      return list.map((row) => {
        const record: Record<string, string> = {};
        if (row && typeof row === "object") {
          for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
            if (value != null) record[key] = String(value);
          }
        }
        return record;
      });
    } catch {
      return [];
    }
  }

  return [...trimmed.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => {
    const block = match[1] ?? "";
    const record: Record<string, string> = {};
    for (const field of block.matchAll(/<([A-Za-z0-9_]+)>(?:<!\[CDATA\[)?([^<]*)/g)) {
      const key = field[1];
      const value = field[2]?.trim();
      if (key && value) record[key] = value;
    }
    return record;
  });
}

export function getDataGoKrKey(): string | undefined {
  const key = process.env.DATA_GO_KR_KEY?.trim();
  return key || undefined;
}

export async function fetchDataGoKr(
  endpoint: string,
  params: Record<string, string>,
): Promise<{ items: Record<string, string>[]; error?: string }> {
  const serviceKey = getDataGoKrKey();
  if (!serviceKey) {
    return { items: [], error: "DATA_GO_KR_KEY missing" };
  }

  const url = new URL(endpoint);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("ServiceKey", serviceKey);
  url.searchParams.set("_type", "json");
  url.searchParams.set("type", "json");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json, application/xml, text/xml, */*" },
      next: { revalidate: 3600 },
    });
    const text = await res.text();
    if (!res.ok) {
      return { items: [], error: `HTTP ${res.status}` };
    }
    if (/SERVICE_KEY_IS_NOT_REGISTERED|APPLICATION_ERROR|INVALID_REQUEST/i.test(text)) {
      const resultMsg = tag(text, "returnAuthMsg") ?? tag(text, "errMsg") ?? "unauthorized dataset";
      return { items: [], error: resultMsg };
    }
    return { items: parseDataGoKrItems(text) };
  } catch (err) {
    return { items: [], error: err instanceof Error ? err.message : "fetch failed" };
  }
}
