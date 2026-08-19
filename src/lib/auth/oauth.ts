import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { envAccountEmail } from "@/lib/auth/accounts";
import { isInternalAccount } from "@/lib/auth/access";
import { isOAuthProvider, OAUTH_PROVIDERS, type OAuthProvider } from "@/lib/auth/oauth-providers";
import { createSession, requestIsHttps, sessionCookieOptions } from "@/lib/auth/session";
import { publicOrigin } from "@/lib/hosts";
import { prisma } from "@/lib/db";

export type { OAuthProvider } from "@/lib/auth/oauth-providers";
export { isOAuthProvider, OAUTH_PROVIDERS } from "@/lib/auth/oauth-providers";

const STATE_COOKIE = "nuami-oauth-state";

interface ProviderConfig {
  authUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  scope: string;
  clientId: string;
  clientSecret: string;
  tokenMethod: "POST" | "GET";
}

export interface OAuthStatePayload {
  nonce: string;
  provider: OAuthProvider;
  redirect: string;
}

interface SocialProfile {
  id: string;
  email: string;
  name: string;
}

function configured(id?: string, secret?: string): boolean {
  return Boolean(id && secret && !id.startsWith("your_"));
}

export function oauthConfig(provider: OAuthProvider): ProviderConfig | null {
  const map: Record<OAuthProvider, Omit<ProviderConfig, "clientId" | "clientSecret"> & { id?: string; secret?: string }> = {
    google: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userinfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
      scope: "openid email profile",
      tokenMethod: "POST",
      id: process.env.GOOGLE_CLIENT_ID,
      secret: process.env.GOOGLE_CLIENT_SECRET,
    },
    kakao: {
      authUrl: "https://kauth.kakao.com/oauth/authorize",
      tokenUrl: "https://kauth.kakao.com/oauth/token",
      userinfoUrl: "https://kapi.kakao.com/v2/user/me",
      scope: "profile_nickname profile_image account_email",
      tokenMethod: "POST",
      id: process.env.KAKAO_CLIENT_ID,
      secret: process.env.KAKAO_CLIENT_SECRET,
    },
    naver: {
      authUrl: "https://nid.naver.com/oauth2.0/authorize",
      tokenUrl: "https://nid.naver.com/oauth2.0/token",
      userinfoUrl: "https://openapi.naver.com/v1/nid/me",
      scope: "profile email",
      tokenMethod: "POST",
      id: process.env.NAVER_CLIENT_ID,
      secret: process.env.NAVER_CLIENT_SECRET,
    },
    line: {
      authUrl: "https://access.line.me/oauth2/v2.1/authorize",
      tokenUrl: "https://api.line.me/oauth2/v2.1/token",
      userinfoUrl: "https://api.line.me/v2/profile",
      scope: "profile openid email",
      tokenMethod: "POST",
      id: process.env.LINE_CLIENT_ID,
      secret: process.env.LINE_CLIENT_SECRET,
    },
    facebook: {
      authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
      userinfoUrl: "https://graph.facebook.com/me?fields=id,name,email,picture",
      scope: "email public_profile",
      tokenMethod: "GET",
      id: process.env.FACEBOOK_CLIENT_ID,
      secret: process.env.FACEBOOK_CLIENT_SECRET,
    },
  };
  const row = map[provider];
  if (!configured(row.id, row.secret)) return null;
  return {
    authUrl: row.authUrl,
    tokenUrl: row.tokenUrl,
    userinfoUrl: row.userinfoUrl,
    scope: row.scope,
    tokenMethod: row.tokenMethod,
    clientId: row.id!,
    clientSecret: row.secret!,
  };
}

export function configuredProviders(): OAuthProvider[] {
  return OAUTH_PROVIDERS.filter((provider) => oauthConfig(provider));
}

export function callbackUrl(request: Request, provider: OAuthProvider): string {
  return `${publicOrigin(request)}/api/auth/callback/${provider}`;
}

export function authorizationUrl(request: Request, provider: OAuthProvider, nonce: string): string | null {
  const config = oauthConfig(provider);
  if (!config) return null;
  const url = new URL(config.authUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", callbackUrl(request, provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", nonce);
  if (provider === "google") url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export function newOAuthNonce(): string {
  return randomBytes(16).toString("hex");
}

export function oauthStateCookie(payload: OAuthStatePayload, request: Request, clear = false) {
  return {
    name: STATE_COOKIE,
    value: clear ? "" : Buffer.from(JSON.stringify(payload)).toString("base64url"),
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: clear ? 0 : 600,
    secure: requestIsHttps(request),
  };
}

export function readOAuthState(request: Request): OAuthStatePayload | null {
  const raw = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(decodeURIComponent(raw), "base64url").toString()) as OAuthStatePayload;
    if (!parsed?.nonce || !isOAuthProvider(parsed.provider)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeAppRedirect(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/admin") || value.startsWith("/console") || value.startsWith("/api")) return "/";
  return value;
}

export async function exchangeOAuth(
  provider: OAuthProvider,
  code: string,
  request: Request,
  nonce: string,
): Promise<SocialProfile> {
  const config = oauthConfig(provider);
  if (!config) throw new Error("PROVIDER_NOT_CONFIGURED");

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: callbackUrl(request, provider),
    client_id: config.clientId,
    client_secret: config.clientSecret,
    state: nonce,
  });

  let tokenRes: Response;
  if (config.tokenMethod === "GET") {
    const url = new URL(config.tokenUrl);
    params.forEach((value, key) => url.searchParams.set(key, value));
    tokenRes = await fetch(url, { headers: { Accept: "application/json" } });
  } else {
    tokenRes = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: params,
    });
  }

  const tokenText = await tokenRes.text();
  let tokenJson: { access_token?: string; id_token?: string; error?: string } = {};
  try {
    tokenJson = JSON.parse(tokenText) as typeof tokenJson;
  } catch {
    const parsed = new URLSearchParams(tokenText);
    tokenJson = {
      access_token: parsed.get("access_token") ?? undefined,
      id_token: parsed.get("id_token") ?? undefined,
      error: parsed.get("error") ?? undefined,
    };
  }
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error || "TOKEN_EXCHANGE_FAILED");
  }

  const userRes = await fetch(config.userinfoUrl, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}`, Accept: "application/json" },
  });
  const profile = (await userRes.json()) as Record<string, unknown>;
  return normalizeProfile(provider, profile, tokenJson.id_token);
}

function emailFromIdToken(idToken?: string): string | undefined {
  if (!idToken) return undefined;
  const payload = idToken.split(".")[1];
  if (!payload) return undefined;
  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString()) as { email?: unknown };
    return typeof json.email === "string" ? json.email : undefined;
  } catch {
    return undefined;
  }
}

function normalizeProfile(provider: OAuthProvider, profile: Record<string, unknown>, idToken?: string): SocialProfile {
  if (provider === "kakao") {
    const account = (profile.kakao_account as Record<string, unknown> | undefined) ?? {};
    const properties = (profile.properties as Record<string, unknown> | undefined) ?? {};
    const id = String(profile.id ?? "kakao");
    return {
      id,
      email: String(account.email ?? `${id}@kakao.oauth.nuami.local`),
      name: String(account.name ?? properties.nickname ?? "카카오 사용자"),
    };
  }
  if (provider === "naver") {
    const response = (profile.response as Record<string, unknown> | undefined) ?? {};
    const id = String(response.id ?? "naver");
    return {
      id,
      email: String(response.email ?? `${id}@naver.oauth.nuami.local`),
      name: String(response.name ?? response.nickname ?? "네이버 사용자"),
    };
  }
  if (provider === "line") {
    const id = String(profile.userId ?? profile.sub ?? "line");
    return {
      id,
      email: String(profile.email ?? emailFromIdToken(idToken) ?? `${id}@line.oauth.nuami.local`),
      name: String(profile.displayName ?? profile.name ?? "LINE 사용자"),
    };
  }
  if (provider === "facebook") {
    const id = String(profile.id ?? "facebook");
    return {
      id,
      email: String(profile.email ?? `${id}@facebook.oauth.nuami.local`),
      name: String(profile.name ?? "Facebook 사용자"),
    };
  }
  const id = String(profile.sub ?? profile.id ?? "google");
  return {
    id,
    email: String(profile.email ?? `${id}@google.oauth.nuami.local`),
    name: String(profile.name ?? "Google 사용자"),
  };
}

export async function upsertSocialUser(provider: OAuthProvider, profile: SocialProfile) {
  const email = profile.email.trim().toLowerCase();
  const env = envAccountEmail(email);
  if (env) return env;

  const byProvider = await prisma.authUser.findFirst({
    where: { provider, providerAccountId: profile.id },
  });
  if (byProvider) {
    if (byProvider.status !== "ACTIVE") {
      await prisma.authUser.update({ where: { id: byProvider.id }, data: { status: "ACTIVE" } });
    }
    return { email: byProvider.email, role: "tester" as const };
  }

  const byEmail = await prisma.authUser.findUnique({ where: { email } });
  if (byEmail) {
    await prisma.authUser.update({
      where: { id: byEmail.id },
      data: { provider, providerAccountId: profile.id, status: "ACTIVE" },
    });
    return { email: byEmail.email, role: "tester" as const };
  }

  const created = await prisma.authUser.create({
    data: {
      email,
      provider,
      providerAccountId: profile.id,
      status: "ACTIVE",
      passwordHash: null,
    },
  });
  return { email: created.email, role: "tester" as const };
}

export async function redirectWithAppSession(
  request: Request,
  email: string,
  role: "admin" | "tester",
  redirectTo: string,
) {
  const token = await createSession(email, role);
  const dest = isInternalAccount(role) ? "/console" : safeAppRedirect(redirectTo);
  const response = NextResponse.redirect(new URL(dest, `${publicOrigin(request)}/`), 303);
  response.cookies.set(sessionCookieOptions(token, false, request.headers.get("host") ?? "", requestIsHttps(request)));
  response.cookies.set(oauthStateCookie({ nonce: "", provider: "google", redirect: "/" }, request, true));
  return response;
}

export function oauthFail(request: Request, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, `${publicOrigin(request)}/`), 303);
}
