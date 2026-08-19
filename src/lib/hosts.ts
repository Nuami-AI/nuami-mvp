/** Planned hosts. Unset = local/preview; all products share one origin via path prefixes. */

export const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST?.trim() ?? "";
export const ADMIN_HOST = process.env.NEXT_PUBLIC_ADMIN_HOST?.trim() ?? "";
export const CONSOLE_HOST = process.env.NEXT_PUBLIC_CONSOLE_HOST?.trim() ?? "";

export type HostKind = "app" | "admin" | "console" | "local";

const APP_ONLY_PREFIXES = ["/mypage", "/guide", "/content", "/history", "/saved", "/campus"];

export function hostnameOf(hostHeader: string): string {
  return hostHeader.split(":")[0]?.toLowerCase() ?? "";
}

export function isLoopbackHost(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local") ||
    host.endsWith(".vercel.app")
  );
}

export function hostKind(hostHeader: string): HostKind {
  const host = hostnameOf(hostHeader);
  if (CONSOLE_HOST && host === CONSOLE_HOST) return "console";
  if (ADMIN_HOST && host === ADMIN_HOST) return "admin";
  if (APP_HOST && host === APP_HOST) return "app";
  // NEXT_PUBLIC_* is baked in at build time. Infer from the hostname so
  // app/admin/console still split when those env vars were missing on Vercel.
  if (host.startsWith("console.")) return "console";
  if (host.startsWith("admin.")) return "admin";
  if (host.startsWith("app.")) return "app";
  return "local";
}

/** Hostname for cross-product redirects (env first, else sibling of the current host). */
export function productHost(kind: "app" | "admin" | "console", hostHeader: string): string {
  const configured = kind === "app" ? APP_HOST : kind === "admin" ? ADMIN_HOST : CONSOLE_HOST;
  if (configured) return configured;
  const host = hostnameOf(hostHeader);
  const rest = host.replace(/^(app|admin|console)\./, "");
  if (rest && rest !== host) return `${kind}.${rest}`;
  return "";
}

/** Host-only cookies. Never set Domain=.nuami.kr — login on one product must not grant the others. */
export function sharedCookieDomain(): string | undefined {
  return undefined;
}

export function isAppOnlyPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return APP_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isConsolePath(pathname: string): boolean {
  return pathname === "/console" || pathname.startsWith("/console/");
}

/** Institution admin: /admin/{orgSlug}/... — not /admin itself. */
export function isInstitutionAdminPath(pathname: string): boolean {
  if (!pathname.startsWith("/admin/")) return false;
  const slug = pathname.slice("/admin/".length).split("/")[0] ?? "";
  return slug.length > 0 && slug !== "knowledge";
}

export function originFor(host: string, requestUrl: string): string {
  const protocol = new URL(requestUrl).protocol.replace(":", "") || "https";
  return `${protocol}://${host}`;
}

/** Origin the browser actually used (LAN IP on mobile), not server-side localhost. */
export function publicOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protoHeader = request.headers.get("x-forwarded-proto");
  const proto =
    protoHeader?.split(",")[0]?.trim() ||
    new URL(request.url).protocol.replace(":", "") ||
    "http";
  if (!host) return new URL(request.url).origin;
  return `${proto}://${host}`;
}

export function homeHrefForRole(role: "admin" | "tester"): string {
  if (typeof window === "undefined") return role === "admin" ? "/console" : "/";
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  if (role === "admin") {
    const consoleHost = productHost("console", host);
    if (consoleHost && host !== consoleHost && !isLoopbackHost(host)) {
      return `${protocol}//${consoleHost}/`;
    }
    return "/console";
  }
  const appHost = productHost("app", host);
  if (appHost && host !== appHost && !isLoopbackHost(host)) {
    return `${protocol}//${appHost}/`;
  }
  return "/";
}
