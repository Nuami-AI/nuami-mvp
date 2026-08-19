"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AuthBottomBar, AuthChrome, AuthInput, AuthTitle } from "@/components/login/AuthChrome";
import { isValidEmail, isValidPassword } from "@/lib/auth/validation";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

type Step = "terms" | "email" | "code" | "password" | "done";
type TermId = "terms" | "privacy" | "marketing" | "third";

const TERM_COPY: Record<TermId, { title: TranslationKey; body: TranslationKey }> = {
  terms: { title: "signup.terms.docTitle", body: "signup.terms.docBody" },
  privacy: { title: "signup.privacy.docTitle", body: "signup.privacy.docBody" },
  marketing: { title: "signup.marketing.docTitle", body: "signup.marketing.docBody" },
  third: { title: "signup.third.docTitle", body: "signup.third.docBody" },
};

export function SignupFlow() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("terms");
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [thirdParty, setThirdParty] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<TermId | null>(null);

  const requiredOk = age && terms && privacy;
  const all = requiredOk && marketing && thirdParty;

  function toggleAll() {
    const next = !all;
    setAge(next);
    setTerms(next);
    setPrivacy(next);
    setMarketing(next);
    setThirdParty(next);
  }

  async function requestCode() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request-code", email }),
    });
    const body = (await res.json()) as { error?: string; devCode?: string | null };
    setBusy(false);
    if (!res.ok) {
      setError(body.error === "EMAIL_TAKEN" ? t("signup.email.taken") : t("auth.sendFail"));
      return;
    }
    setDevCode(body.devCode ?? null);
    setStep("code");
  }

  async function verifyCode() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
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

  async function complete() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "complete",
        email,
        code,
        password,
        marketingAgreed: marketing,
        thirdPartyAgreed: thirdParty,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(t("signup.fail"));
      return;
    }
    const login = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, audience: "app", redirect: "/" }),
    });
    if (login.ok) {
      window.location.replace("/");
      return;
    }
    setStep("done");
  }

  return (
    <AuthChrome
      title={t("signup.title")}
      onBack={() => {
        if (step === "terms") router.push("/login/email");
        else if (step === "email") setStep("terms");
        else if (step === "code") setStep("email");
        else if (step === "password") setStep("code");
        else router.push("/login/email");
      }}
    >
      {step === "terms" ? (
        <>
          <AuthTitle line1={t("signup.terms.title1")} line2={t("signup.terms.title2")} />
          <div className="mt-8 space-y-2">
            <label className="flex items-center gap-2 rounded-lg bg-gray-100/40 px-3 py-[11px]">
              <Check on={all} />
              <button type="button" onClick={toggleAll} className="text-left text-[18px] font-semibold">
                {t("signup.terms.all")}
              </button>
            </label>
            <Row label={t("signup.terms.age")} checked={age} onChange={setAge} viewLabel={t("auth.view")} />
            <Row label={t("signup.terms.service")} checked={terms} onChange={setTerms} view={() => setViewing("terms")} viewLabel={t("auth.view")} />
            <Row label={t("signup.terms.privacy")} checked={privacy} onChange={setPrivacy} view={() => setViewing("privacy")} viewLabel={t("auth.view")} />
            <Row label={t("signup.terms.marketing")} checked={marketing} onChange={setMarketing} view={() => setViewing("marketing")} viewLabel={t("auth.view")} />
            <Row label={t("signup.terms.third")} checked={thirdParty} onChange={setThirdParty} view={() => setViewing("third")} viewLabel={t("auth.view")} />
          </div>
          <p className="mt-6 text-[12px] leading-4 text-text-tertiary">{t("signup.terms.note")}</p>
          <div className="h-16" />
          <AuthBottomBar disabled={!requiredOk} onClick={() => setStep("email")}>
            {t("auth.next")}
          </AuthBottomBar>
        </>
      ) : null}

      {step === "email" ? (
        <>
          <AuthTitle line1={t("signup.email.title1")} line2={t("signup.email.title2")} />
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
          <AuthTitle line1={t("signup.password.title1")} line2={t("signup.password.title2")} />
          <p className="mt-4 text-[14px] text-text-secondary">{t("auth.passwordMin")}</p>
          <div className="mt-8 space-y-[18px]">
            <AuthInput
              type="password"
              autoComplete="new-password"
              placeholder={t("auth.password")}
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
            onClick={() => void complete()}
          >
            {busy ? t("signup.creating") : t("signup.submit")}
          </AuthBottomBar>
        </>
      ) : null}

      {step === "done" ? (
        <>
          <AuthTitle line1={t("signup.done.title1")} line2={t("signup.done.title2")} />
          <div className="mt-10">
            <AuthBottomBar disabled={false} onClick={() => router.push("/login/email")}>
              {t("login.email.submit")}
            </AuthBottomBar>
          </div>
        </>
      ) : null}

      {viewing ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 px-4 pb-6">
          <div className="w-full max-w-[448px] rounded-2xl bg-white p-5">
            <p className="text-lg font-semibold">{t(TERM_COPY[viewing].title)}</p>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{t(TERM_COPY[viewing].body)}</p>
            <button
              type="button"
              className="mt-5 h-12 w-full appearance-none rounded-lg bg-accent-700 text-[16px] font-semibold text-white"
              style={{ backgroundColor: "#8651F2", color: "#ffffff" }}
              onClick={() => setViewing(null)}
            >
              {t("auth.close")}
            </button>
          </div>
        </div>
      ) : null}
    </AuthChrome>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <span
      className={`flex size-6 shrink-0 items-center justify-center rounded-lg text-[12px] text-white ${
        on ? "bg-accent-700" : "bg-[rgba(138,137,129,0.35)]"
      }`}
    >
      {on ? "✓" : ""}
    </span>
  );
}

function Row({
  label,
  checked,
  onChange,
  view,
  viewLabel,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  view?: () => void;
  viewLabel: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 pl-3">
      <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onChange(!checked)}>
        <Check on={checked} />
        <span className="text-[14px] text-text-secondary">{label}</span>
      </button>
      {view ? (
        <button type="button" onClick={view} className="px-2 text-[12px] text-text-tertiary">
          {viewLabel}
        </button>
      ) : null}
    </div>
  );
}
