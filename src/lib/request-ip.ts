import { headers } from "next/headers";

export async function getRequestClientIp(): Promise<string> {
  const ctx = await getRequestAccessContext();
  return ctx.ip || "—";
}

export async function getRequestAccessContext(): Promise<{ ip: string; country: string }> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") ?? h.get("x-vercel-forwarded-for");
  const raw =
    forwarded?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "";
  const ip = raw === "::1" ? "127.0.0.1" : raw;
  const country = (
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    h.get("x-country-code") ||
    ""
  )
    .trim()
    .toUpperCase();
  return { ip, country };
}
