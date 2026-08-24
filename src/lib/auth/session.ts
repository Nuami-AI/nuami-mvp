// Design Ref: §7 — jose JWT, Edge-compatible (no Node APIs)
import { SignJWT, jwtVerify } from "jose";
import { type NextRequest } from "next/server";

export interface SessionPayload {
  email: string;
  role: "admin" | "tester";
  mustChangePassword?: boolean;
  iat: number;
  exp: number;
}

export const COOKIE_NAME = "nuami-session";
/** Absolute session lifetime — auto logout after 1 hour. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60;
const MAX_AGE = SESSION_MAX_AGE_SECONDS;

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSession(
  email: string,
  role: "admin" | "tester",
  extra?: { mustChangePassword?: boolean },
): Promise<string> {
  return new SignJWT({
    email,
    role,
    ...(extra?.mustChangePassword ? { mustChangePassword: true } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as SessionPayload;
}

export async function getSessionFromRequest(
  request: Request | NextRequest
): Promise<SessionPayload | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match?.[1]) return null;
  try {
    return await verifySession(match[1]);
  } catch {
    return null;
  }
}

export function sessionCookieOptions(
  value: string,
  clear = false,
  _hostHeader?: string,
  secure?: boolean,
) {
  return {
    name: COOKIE_NAME,
    value: clear ? "" : value,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: clear ? 0 : MAX_AGE,
    secure: secure ?? process.env.NODE_ENV === "production",
    // no Domain — host-only. Do not share across app/admin/console subdomains.
  };
}

export function requestIsHttps(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}
