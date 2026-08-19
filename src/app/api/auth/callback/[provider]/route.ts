import {
  exchangeOAuth,
  isOAuthProvider,
  oauthFail,
  readOAuthState,
  redirectWithAppSession,
  upsertSocialUser,
} from "@/lib/auth/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
): Promise<Response> {
  const { provider } = await context.params;
  if (!isOAuthProvider(provider)) return oauthFail(request, "OAUTH_FAILED");

  const url = new URL(request.url);
  if (url.searchParams.get("error")) return oauthFail(request, "OAUTH_DENIED");

  const code = url.searchParams.get("code") ?? "";
  const nonce = url.searchParams.get("state") ?? "";
  const stored = readOAuthState(request);
  if (!code || !nonce || !stored || stored.nonce !== nonce || stored.provider !== provider) {
    return oauthFail(request, "OAUTH_FAILED");
  }

  try {
    const profile = await exchangeOAuth(provider, code, request, nonce);
    const account = await upsertSocialUser(provider, profile);
    return redirectWithAppSession(request, account.email, account.role, stored.redirect);
  } catch {
    return oauthFail(request, "OAUTH_FAILED");
  }
}
