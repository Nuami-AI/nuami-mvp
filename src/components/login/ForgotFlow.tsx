"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AuthBottomBar, AuthChrome, AuthInput, AuthTitle } from "@/components/login/AuthChrome";
import { isValidEmail, isValidPassword } from "@/lib/auth/validation";
import { useLanguage } from "@/lib/i18n";

type Step = "email" | "code" | "password" | "missing";

export function ForgotFlow() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request-code", email }),
    });
    const body = (await res.json()) as { error?: string; devCode?: string | null };
    setBusy(false);
    if (res.status === 404) {
      setStep("missing");
      return;
    }
    if (!res.ok) {
      setError(t("auth.sendFail"));
      return;
    }
    setDevCode(body.devCode ?? null);
    setStep("code");
  }

  async function verifyCode() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify-code", email, code }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(t("auth.invalidCode"));
      return;
    }
    setStep("password");
  }

  async function reset() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset", email, code, password }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(t("forgot.fail"));
      return;
    }
    router.replace("/login/email");
  }

  return (
    <AuthChrome
      title={t("forgot.title")}
      onBack={() => {
        if (step === "email" || step === "missing") router.push("/login/email");
        else if (step === "code") setStep("email");
        else setStep("code");
      }}
    >
      {step === "email" ? (
        <>
          <AuthTitle line1={t("forgot.email.title1")} line2={t("forgot.email.title2")} />
          <div className="mt-8">
            <AuthInput
              type="email"
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error ? <p className="mt-3 text-[13px] text-danger-800">{error}</p> : null}
          <div className="h-16" />
          <AuthBottomBar disabled={!isValidEmail(email) || busy} onClick={() => void requestCode()}>
            {busy ? t("auth.sending") : t("auth.next")}
          </AuthBottomBar>
        </>
      ) : null}

      {step === "missing" ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 px-4 pb-6">
          <div className="w-full max-w-[448px] rounded-2xl bg-white p-5">
            <p className="text-lg font-semibold">{t("forgot.missing.title")}</p>
            <p className="mt-2 text-sm text-text-secondary">{t("forgot.missing.body")}</p>
            <button
              type="button"
              className="mt-5 h-12 w-full appearance-none rounded-lg bg-accent-700 text-[16px] font-semibold text-white"
              style={{ backgroundColor: "#8651F2", color: "#ffffff" }}
              onClick={() => router.push("/signup")}
            >
              {t("login.email.signup")}
            </button>
            <button
              type="button"
              className="mt-2 h-12 w-full appearance-none rounded-lg border border-accent-700 text-[16px] font-semibold text-accent-700"
              style={{ backgroundColor: "#ffffff", color: "#8651F2", borderColor: "#8651F2" }}
              onClick={() => setStep("email")}
            >
              {t("forgot.missing.retry")}
            </button>
          </div>
        </div>
      ) : null}

      {step === "code" ? (
        <>
          <AuthTitle line1={t("signup.code.title1")} line2={t("signup.code.title2")} />
          <div className="mt-8">
            <AuthInput
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t("auth.codePlaceholder")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          {devCode ? (
            <p className="mt-3 text-[13px] text-accent-700">{t("auth.devCode").replace("{code}", devCode)}</p>
          ) : (
            <p className="mt-3 text-[13px] text-text-tertiary">{t("auth.codeHint")}</p>
          )}
          {error ? <p className="mt-3 text-[13px] text-danger-800">{error}</p> : null}
          <button
            type="button"
            className="mt-4 text-[14px] font-semibold text-accent-700"
            onClick={() => void requestCode()}
          >
            {t("auth.resend")}
          </button>
          <div className="h-16" />
          <AuthBottomBar disabled={code.trim().length < 6 || busy} onClick={() => void verifyCode()}>
            {busy ? t("auth.checking") : t("auth.next")}
          </AuthBottomBar>
        </>
      ) : null}

      {step === "password" ? (
        <>
          <AuthTitle line1={t("forgot.password.title1")} line2={t("forgot.password.title2")} />
          <p className="mt-4 text-[14px] text-text-secondary">{t("auth.passwordMin")}</p>
          <div className="mt-8 space-y-[18px]">
            <AuthInput
              type="password"
              autoComplete="new-password"
              placeholder={t("forgot.password.placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <AuthInput
              type="password"
              autoComplete="new-password"
              placeholder={t("auth.confirmPassword")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error ? <p className="mt-3 text-[13px] text-danger-800">{error}</p> : null}
          <div className="h-16" />
          <AuthBottomBar
            disabled={!isValidPassword(password) || password !== confirm || busy}
            onClick={() => void reset()}
          >
            {busy ? t("forgot.saving") : t("forgot.save")}
          </AuthBottomBar>
        </>
      ) : null}
    </AuthChrome>
  );
}
