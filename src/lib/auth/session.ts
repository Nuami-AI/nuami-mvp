// Design Ref: §7 — jose JWT, Edge-compatible (no Node APIs)
import { SignJWT, jwtVerify } from "jose";
import { type NextRequest } from "next/server";

export interface SessionPayload {
  email: string;
  role: "admin" | "tester";
  iat: number;
  exp: number;
}

export const COOKIE_NAME = "nuami-session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSession(email: string, role: "admin" | "tester"): Promise<string> {
  return new SignJWT({ email, role })
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

export function sessionCookieOptions(value: string, clear = false) {
  return {
    name: COOKIE_NAME,
    value: clear ? "" : value,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: clear ? 0 : MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  };
}
