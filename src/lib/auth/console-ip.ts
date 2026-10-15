import { randomUUID } from "node:crypto";

import { isSuperAdmin } from "@/lib/auth/access";
import { prisma } from "@/lib/db";

export const CONSOLE_IP_GLOBAL = "*";

export type ConsoleIpMode = "allow_all" | "allowlist";

export interface ConsoleIpPolicyView {
  targetEmail: string;
  mode: ConsoleIpMode;
  allowOverseas: boolean;
  allowedIps: string[];
  inherited: boolean;
  updatedBy: string | null;
  updatedAt: Date | null;
}

export type ConsoleIpBlockReason = "IP_BLOCKED" | "OVERSEAS_BLOCKED";

const DEFAULT_POLICY: Omit<ConsoleIpPolicyView, "targetEmail" | "inherited"> = {
  mode: "allow_all",
  allowOverseas: true,
  allowedIps: [],
  updatedBy: null,
  updatedAt: null,
};

type PolicyRow = {
  targetEmail: string;
  mode: string;
  allowOverseas: unknown;
  allowedIps: string;
  updatedBy: string;
  updatedAt: Date | string;
};

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" || typeof value === "bigint") return Number(value) !== 0;
  return value === "1" || value === "true";
}

function parseIps(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    /* plain text fallback */
  }
  return raw
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeIpList(input: string[] | string): string[] {
  const items = Array.isArray(input) ? input : parseIps(input);
  const seen = new Set<string>();
  for (const item of items) {
    const value = item.trim();
    if (!value || !isValidIpOrCidr(value)) continue;
    seen.add(value);
  }
  return [...seen];
}

function isValidIpOrCidr(value: string): boolean {
  const [ip, mask] = value.split("/");
  if (!isIPv4(ip ?? "")) return false;
  if (mask == null || mask === "") return true;
  const bits = Number(mask);
  return Number.isInteger(bits) && bits >= 0 && bits <= 32;
}

function isIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

function ipToInt(ip: string): number {
  return ip.split(".").reduce((sum, part) => (sum << 8) + Number(part), 0) >>> 0;
}

export function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip || ip === "—") return true;
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  if (!isIPv4(ip)) return false;
  const n = ipToInt(ip);
  return (
    (n >>> 24) === 10 ||
    (n >>> 24) === 127 ||
    ((n >>> 24) === 172 && ((n >>> 16) & 0xff) >= 16 && ((n >>> 16) & 0xff) <= 31) ||
    ((n >>> 24) === 192 && ((n >>> 16) & 0xff) === 168)
  );
}

function ipMatchesEntry(ip: string, entry: string): boolean {
  if (ip === entry) return true;
  if (!isIPv4(ip)) return false;
  const [base, mask] = entry.split("/");
  if (!base || mask == null) return false;
  if (!isIPv4(base)) return false;
  const bits = Number(mask);
  if (bits === 0) return true;
  const shift = 32 - bits;
  return ipToInt(ip) >>> shift === ipToInt(base) >>> shift;
}

export function ipAllowedByList(ip: string, allowedIps: string[]): boolean {
  if (allowedIps.length === 0) return false;
  return allowedIps.some((entry) => ipMatchesEntry(ip, entry));
}

function rowToView(row: PolicyRow, inherited: boolean): ConsoleIpPolicyView {
  return {
    targetEmail: row.targetEmail,
    mode: row.mode === "allowlist" ? "allowlist" : "allow_all",
    allowOverseas: toBool(row.allowOverseas),
    allowedIps: parseIps(row.allowedIps),
    inherited,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
  };
}

async function loadRows(): Promise<PolicyRow[]> {
  try {
    return await prisma.$queryRaw<PolicyRow[]>`
      SELECT \`targetEmail\`, \`mode\`, \`allowOverseas\`, \`allowedIps\`, \`updatedBy\`, \`updatedAt\`
      FROM \`ConsoleIpPolicy\`
    `;
  } catch (err) {
    console.warn("[console-ip] load failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function listConsoleIpPolicies(): Promise<ConsoleIpPolicyView[]> {
  return (await loadRows()).map((row) => rowToView(row, row.targetEmail === CONSOLE_IP_GLOBAL));
}

export async function resolveConsoleIpPolicy(email: string): Promise<ConsoleIpPolicyView> {
  const key = email.trim().toLowerCase();
  const rows = await loadRows();
  const own = rows.find((row) => row.targetEmail === key);
  if (own) return rowToView(own, false);
  const global = rows.find((row) => row.targetEmail === CONSOLE_IP_GLOBAL);
  if (global) return { ...rowToView(global, true), targetEmail: key };
  return { targetEmail: key, inherited: true, ...DEFAULT_POLICY };
}

export async function upsertConsoleIpPolicy(input: {
  targetEmail: string;
  mode: ConsoleIpMode;
  allowOverseas: boolean;
  allowedIps: string[];
  updatedBy: string;
}): Promise<void> {
  const targetEmail = input.targetEmail.trim().toLowerCase() || CONSOLE_IP_GLOBAL;
  const mode: ConsoleIpMode = input.mode === "allowlist" ? "allowlist" : "allow_all";
  const allowedIps = JSON.stringify(normalizeIpList(input.allowedIps));
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO \`ConsoleIpPolicy\`
      (\`id\`, \`targetEmail\`, \`mode\`, \`allowOverseas\`, \`allowedIps\`, \`updatedBy\`, \`createdAt\`, \`updatedAt\`)
    VALUES
      (${id}, ${targetEmail}, ${mode}, ${input.allowOverseas}, ${allowedIps}, ${input.updatedBy}, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
      \`mode\` = ${mode},
      \`allowOverseas\` = ${input.allowOverseas},
      \`allowedIps\` = ${allowedIps},
      \`updatedBy\` = ${input.updatedBy},
      \`updatedAt\` = NOW(3)
  `;
}

export async function deleteConsoleIpPolicy(targetEmail: string): Promise<void> {
  const key = targetEmail.trim().toLowerCase();
  if (!key || key === CONSOLE_IP_GLOBAL) return;
  await prisma.$executeRaw`DELETE FROM \`ConsoleIpPolicy\` WHERE \`targetEmail\` = ${key}`;
}

export function policyForEmail(email: string, policies: ConsoleIpPolicyView[]): ConsoleIpPolicyView {
  const key = email.trim().toLowerCase();
  const own = policies.find((row) => row.targetEmail === key);
  if (own) return { ...own, inherited: false };
  const global = policies.find((row) => row.targetEmail === CONSOLE_IP_GLOBAL);
  if (global) return { ...global, targetEmail: key, inherited: true };
  return { targetEmail: key, inherited: true, ...DEFAULT_POLICY };
}

export async function applyConsoleIpPolicyToAll(input: {
  mode: ConsoleIpMode;
  allowOverseas: boolean;
  allowedIps: string[];
  updatedBy: string;
}): Promise<void> {
  await upsertConsoleIpPolicy({
    targetEmail: CONSOLE_IP_GLOBAL,
    mode: input.mode,
    allowOverseas: input.allowOverseas,
    allowedIps: input.allowedIps,
    updatedBy: input.updatedBy,
  });
  await prisma.$executeRaw`DELETE FROM \`ConsoleIpPolicy\` WHERE \`targetEmail\` <> ${CONSOLE_IP_GLOBAL}`;
}

export function evaluateConsoleIpAccess(input: {
  email: string;
  ip: string;
  country: string;
  policy: ConsoleIpPolicyView;
}): { ok: true } | { ok: false; reason: ConsoleIpBlockReason } {
  if (isSuperAdmin(input.email)) return { ok: true };

  const local = isPrivateOrLocalIp(input.ip);
  if (!input.policy.allowOverseas && !local) {
    const country = input.country.trim().toUpperCase();
    if (country && country !== "KR" && country !== "XX") {
      return { ok: false, reason: "OVERSEAS_BLOCKED" };
    }
  }

  if (input.policy.mode === "allowlist") {
    if (local) return { ok: true };
    if (!input.ip || input.ip === "—") return { ok: false, reason: "IP_BLOCKED" };
    if (!ipAllowedByList(input.ip, input.policy.allowedIps)) {
      return { ok: false, reason: "IP_BLOCKED" };
    }
  }

  return { ok: true };
}

export async function assertConsoleIpAccess(email: string, ip: string, country: string) {
  const policy = await resolveConsoleIpPolicy(email);
  return evaluateConsoleIpAccess({ email, ip, country, policy });
}
