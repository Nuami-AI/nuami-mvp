import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { isValidEmail, isValidPassword } from "@/lib/auth/validation";

export { isValidEmail, isValidPassword };

const CODE_TTL_MS = 10 * 60 * 1000;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashCode(email: string, purpose: string, code: string): string {
  const secret = process.env.SESSION_SECRET ?? "nuami-dev";
  return createHash("sha256").update(`${email}:${purpose}:${code}:${secret}`).digest("hex");
}

export function challengeExpiry(): Date {
  return new Date(Date.now() + CODE_TTL_MS);
}

export function exposeDevCodes(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.AUTH_DEV_CODES === "true";
}
