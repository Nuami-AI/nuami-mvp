"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { NuamiLoginLogo } from "@/components/login/NuamiLoginLogo";
import { HeaderIconButton } from "@/components/ui/header-icon";
import { homeHrefForRole } from "@/lib/hosts";
import type { LoginAudience } from "@/lib/auth/access";
import { useLanguage } from "@/lib/i18n";

const ERROR_COPY: Record<string, string> = {
  UNKNOWN_EMAIL: "등록되지 않은 이메일이에요.",
  WRONG_PASSWORD: "비밀번호가 맞지 않아요.",
  INVALID_BODY: "이메일과 비밀번호를 모두 입력해주세요.",
  SERVER_ERROR: "로그인 서버에 문제가 있어요. 잠시 후 다시 시도해주세요.",
  NETWORK: "네트워크 연결을 확인해주세요.",
  NOT_ORG_STAFF: "이 계정은 기관 관리자 권한이 없습니다.",
  ACCOUNT_INACTIVE: "비활성화된 계정입니다.",
  NOT_INTERNAL: "이 계정은 내부 운영 권한이 없습니다.",
  SOCIAL_ONLY: "이 계정은 소셜 로그인을 사용해주세요.",
};

const DEFAULT_REDIRECT: Record<LoginAudience, string> = {
  app: "/",
  admin: "/admin",
  console: "/console",
};

const CAPTION: Record<LoginAudience, string> = {
  app: "",
  admin: "기관 관리",
  console: "내부 콘솔",
};

export function LoginForm({ audience }: { audience: LoginAudience }) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const redirectTo = searchParams.get("redirect") || DEFAULT_REDIRECT[audience];
  const selfPath = audience === "app" ? "/login/email" : audience === "admin" ? "/admin/login" : "/console/login";
  const canSubmit = email.trim().length > 0 && password.length > 0;

  useEffect(() => {
    const leaked = searchParams.get("email") || searchParams.get("password");
    const code = searchParams.get("error");
    if (code && ERROR_COPY[code]) setError(ERROR_COPY[code]);
    if (leaked) {
      router.replace(code ? `${selfPath}?error=${encodeURIComponent(code)}` : selfPath);
    }
  }, [router, searchParams, selfPath]);

  useEffect(() => {
    if (audience !== "app") return;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data: { authenticated?: boolean; role?: "admin" | "tester" | null }) => {
        if (!data.authenticated) return;
        const href = homeHrefForRole(data.role === "admin" ? "admin" : "tester");
        if (href.startsWith("http")) window.location.replace(href);
        else router.replace(href);
      })
      .catch(() => {});
  }, [audience, router]);

  return (
    <div className="min-h-dvh w-full bg-background text-text-primary">
      <div className="mx-auto flex min-h-dvh w-full max-w-[448px] flex-col">
        <header className="relative flex h-16 items-center px-2">
          {audience === "app" ? (
            <>
              <HeaderIconButton name="back" label="뒤로" href="/login" />
              <span className="absolute left-1/2 -translate-x-1/2 text-[20px] font-semibold tracking-tight">
                {t("login.email.title")}
              </span>
            </>
          ) : null}
        </header>
        <main className="flex flex-1 flex-col px-4 pb-8 pt-8">
          <NuamiLoginLogo />
          {CAPTION[audience] ? (
            <p className="mt-4 text-center text-[13px] font-semibold text-text-tertiary">{CAPTION[audience]}</p>
          ) : null}

          <form
            method="post"
            action="/api/auth/login"
            className="mt-8"
            autoComplete="on"
            noValidate
            onSubmit={(e) => {
              if (!canSubmit) {
                e.preventDefault();
                setError(ERROR_COPY.INVALID_BODY);
                return;
              }
              try {
                localStorage.setItem("last-login-provider", "email");
              } catch {
                /* ignore */
              }
            }}
          >
            <input type="hidden" name="redirect" value={redirectTo} />
            <input type="hidden" name="audience" value={audience} />
            <div className="overflow-hidden rounded-[8px] border border-line-normal bg-white">
              <label htmlFor="email" className="sr-only">
                {t("login.email.placeholder")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "login-error" : undefined}
                placeholder={t("login.email.placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-0 bg-transparent px-4 py-[18px] text-[16px] text-text-primary placeholder:text-text-disabled focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-700"
              />
              <div className="h-px bg-line-normal" />
              <label htmlFor="password" className="sr-only">
                {t("login.password.placeholder")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "login-error" : undefined}
                placeholder={t("login.password.placeholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-0 bg-transparent px-4 py-[18px] text-[16px] text-text-primary placeholder:text-text-disabled focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-700"
              />
            </div>

            {error ? (
              <p
                id="login-error"
                role="alert"
                className="mt-3 rounded-xl bg-danger-50 px-3 py-2.5 text-center text-[13px] font-medium text-danger-800"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                backgroundColor: canSubmit ? "#8651F2" : "#D3D3CD",
                color: canSubmit ? "#ffffff" : "#8A8981",
              }}
              className={`mt-6 h-12 w-full appearance-none rounded-lg text-[16px] font-semibold ${
                canSubmit
                  ? "bg-accent-700 text-white hover:bg-accent-800"
                  : "bg-button-disabled text-text-tertiary opacity-50"
              }`}
            >
              {audience === "app" ? t("login.email.submit") : "로그인"}
            </button>
          </form>

          {audience === "app" ? (
            <>
              <Link
                href="/login/forgot"
                className="mt-6 text-center text-[14px] tracking-wide text-text-secondary"
              >
                {t("login.email.forgot")}
              </Link>
              <div className="mt-auto pt-10 text-center">
                <p className="text-[14px] text-text-secondary">
                  {t("login.email.noAccount")}
                  <Link href="/signup" className="ml-1 font-semibold text-accent-700">
                    {t("login.email.signup")}
                  </Link>
                </p>
                <p className="mt-8 text-[12px] text-text-disabled">{t("login.copyright")}</p>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
