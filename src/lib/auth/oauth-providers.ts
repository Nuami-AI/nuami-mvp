export type OAuthProvider = "google" | "kakao" | "naver" | "line" | "facebook";

export const OAUTH_PROVIDERS: OAuthProvider[] = ["google", "kakao", "naver", "line", "facebook"];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return OAUTH_PROVIDERS.includes(value as OAuthProvider);
}
