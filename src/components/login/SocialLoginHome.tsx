"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { homeHrefForRole } from "@/lib/hosts";
import { LANGUAGE_LABELS, useLanguage, type Language } from "@/lib/i18n";
import type { OAuthProvider } from "@/lib/auth/oauth-providers";
import type { TranslationKey } from "@/lib/i18n";

type LoginAction = OAuthProvider | "email";

const ERROR_COPY: Record<string, string> = {
  OAUTH_FAILED: "소셜 로그인에 실패했어요. 다시 시도해주세요.",
  OAUTH_DENIED: "로그인이 취소되었어요.",
  PROVIDER_NOT_CONFIGURED: "이 로그인 방식은 아직 준비 중이에요.",
};

const LAST_PROVIDER_KEY = "last-login-provider";

const BUTTON: Record<
  LoginAction,
  { className: string; icon?: string; bg: string; fg: string; border: string }
> = {
  kakao: {
    className: "bg-kakao border-kakao text-black",
    icon: "/login/symbol_kakao.svg",
    bg: "#FEE500",
    fg: "#000000",
    border: "#FEE500",
  },
  naver: {
    className: "bg-naver border-naver text-white",
    icon: "/login/symbol_naver.svg",
    bg: "#03C75A",
    fg: "#ffffff",
    border: "#03C75A",
  },
  line: {
    className: "bg-line border-line text-white",
    icon: "/login/symbol_line.svg",
    bg: "#06C755",
    fg: "#ffffff",
    border: "#06C755",
  },
  facebook: {
    className: "bg-facebook border-facebook text-white",
    icon: "/login/symbol_facebook.svg",
    bg: "#0866FF",
    fg: "#ffffff",
    border: "#0866FF",
  },
  google: {
    className: "bg-white border-line-normal text-text-secondary",
    icon: "/login/symbol_google.svg",
    bg: "#ffffff",
    fg: "#575652",
    border: "#E2E2DE",
  },
  email: {
    className: "bg-white border-line-normal text-text-secondary",
    bg: "#ffffff",
    fg: "#575652",
    border: "#E2E2DE",
  },
};

const CONTINUE_KEY: Record<LoginAction, TranslationKey> = {
  kakao: "login.continue.kakao",
  naver: "login.continue.naver",
  google: "login.continue.google",
  line: "login.continue.line",
  facebook: "login.continue.facebook",
  email: "login.continue.email",
};

function orderForLang(lang: Language): LoginAction[] {
  if (lang === "ko") return ["kakao", "naver", "google", "email"];
  if (lang === "ja") return ["line", "google", "email"];
  return ["facebook", "google", "email"];
}

const LANG_OPTIONS: Exclude<Language, "custom">[] = ["ko", "en", "ja", "vi", "zh"];

export function SocialLoginHome({ configured }: { configured: OAuthProvider[] }) {
  const { lang, setLang, t, customLangLabel } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lastProvider, setLastProvider] = useState<string | null>(null);
  const [openLang, setOpenLang] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const error = searchParams.get("error");
  const redirect = searchParams.get("redirect") || "/";

  const actions = orderForLang(lang).filter(
    (action) => action === "email" || configured.includes(action),
  );

  useEffect(() => {
    setLastProvider(localStorage.getItem(LAST_PROVIDER_KEY));
  }, []);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data: { authenticated?: boolean; role?: "admin" | "tester" | null }) => {
        if (!data.authenticated) return;
        const href = homeHrefForRole(data.role === "admin" ? "admin" : "tester");
        if (href.startsWith("http")) window.location.replace(href);
        else router.replace(href);
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!langRef.current?.contains(e.target as Node)) setOpenLang(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const langLabel =
    lang === "custom" ? customLangLabel || "English" : LANGUAGE_LABELS[lang];

  function start(action: LoginAction) {
    localStorage.setItem(LAST_PROVIDER_KEY, action);
    setLastProvider(action);
    if (action === "email") {
      const q = redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : "";
      router.push(`/login/email${q}`);
      return;
    }
    const q = new URLSearchParams();
    if (redirect !== "/") q.set("redirect", redirect);
    window.location.href = `/api/auth/oauth/${action}${q.size ? `?${q}` : ""}`;
  }

  return (
    <div className="min-h-dvh w-full bg-background text-text-primary">
      <div className="mx-auto flex min-h-dvh w-full max-w-[448px] flex-col">
        <div className="px-4 pt-1">
          <div className="relative w-fit" ref={langRef}>
            <button
              type="button"
              onClick={() => setOpenLang((v) => !v)}
              className="flex h-10 items-center gap-2 rounded-lg px-2 text-[14px] font-medium text-text-primary"
              aria-expanded={openLang}
            >
              <span className="relative size-4 overflow-clip">
                <img src="/login/globe.svg" alt="" width={16} height={16} className="size-4" />
              </span>
              {langLabel}
            </button>
            {openLang ? (
              <div className="absolute left-0 top-11 z-20 min-w-[148px] overflow-hidden rounded-lg border border-line-normal bg-white py-1 shadow-sm">
                {LANG_OPTIONS.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setLang(code);
                      setOpenLang(false);
                    }}
                    className={`block w-full px-3 py-2 text-left text-[14px] ${
                      lang === code ? "font-semibold text-accent-700" : "text-text-primary"
                    }`}
                  >
                    {LANGUAGE_LABELS[code]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <BrandLogo variant="color" className="h-11 w-auto" priority />
          <h1 className="text-center text-[24px] font-bold leading-[1.333] tracking-[-0.6px] text-text-primary">
            {t("login.welcome.title")}
          </h1>
        </div>

        <div className="flex flex-col items-center gap-4 px-4 pb-8">
          {error && ERROR_COPY[error] ? (
            <p className="w-full rounded-xl bg-danger-50 px-3 py-2.5 text-center text-[13px] font-medium text-danger-800">
              {ERROR_COPY[error]}
            </p>
          ) : null}
          <div className="relative flex w-full max-w-[448px] flex-col gap-3">
            {actions.map((action) => {
              const spec = BUTTON[action];
              return (
                <div key={action} className="relative">
                  <button
                    type="button"
                    onClick={() => start(action)}
                    style={{
                      backgroundColor: spec.bg,
                      color: spec.fg,
                      borderColor: spec.border,
                    }}
                    className={`flex h-14 w-full appearance-none items-center justify-center gap-2 rounded-lg border border-solid px-8 text-[16px] font-medium ${spec.className}`}
                  >
                    {spec.icon ? (
                      <span className="relative size-8 overflow-clip">
                        <img src={spec.icon} alt="" width={32} height={32} className="size-8" />
                      </span>
                    ) : null}
                    {t(CONTINUE_KEY[action])}
                  </button>
                  {lastProvider === action ? (
                    <span className="absolute -right-1 -top-1 z-10 rounded-full bg-brand-500 px-2 py-1 text-[12px] leading-[1.333] tracking-[0.3px] text-white">
                      {t("login.recent")}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="w-full text-center text-[12px] leading-[1.333] tracking-[0.3px] text-text-disabled">
            {t("login.copyright")}
          </p>
        </div>
      </div>
    </div>
  );
}
