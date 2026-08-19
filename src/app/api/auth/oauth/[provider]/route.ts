import { NextResponse } from "next/server";

import {
  authorizationUrl,
  isOAuthProvider,
  newOAuthNonce,
  oauthFail,
  oauthStateCookie,
} from "@/lib/auth/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
): Promise<Response> {
  const { provider } = await context.params;
  if (!isOAuthProvider(provider)) return oauthFail(request, "OAUTH_FAILED");

  const redirect = new URL(request.url).searchParams.get("redirect") ?? "/";
  const nonce = newOAuthNonce();
  const dest = authorizationUrl(request, provider, nonce);
  if (!dest) return oauthFail(request, "PROVIDER_NOT_CONFIGURED");

  const response = NextResponse.redirect(dest, 303);
  response.cookies.set(
    oauthStateCookie({ nonce, provider, redirect }, request),
  );
  return response;
}
