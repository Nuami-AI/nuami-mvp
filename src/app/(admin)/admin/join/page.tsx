"use client";

import { useState } from "react";
import Link from "next/link";

import { AuthButton, AuthChrome, AuthInput, AuthTitle } from "@/components/login/AuthChrome";

export default function InstitutionJoinPage() {
  const [organizationName, setOrganizationName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/join-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationName, contactEmail, message }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("요청을 보내지 못했어요. 이메일 형식을 확인해 주세요.");
      return;
    }
    setDone(true);
  }

  return (
    <AuthChrome title="기관 계정 문의" onBack={() => history.back()}>
      <AuthTitle line1="기관 관리자 계정은" line2="뉴아미가 발급합니다." />
      <p className="mt-4 text-[14px] leading-relaxed text-text-secondary">
        대학·기관 담당자 로그인은 공개 회원가입이 없습니다. 아래를 남겨 주시면 뉴아미가 연락드립니다.
        이미 안내받은 전용 링크가 있다면 그 주소로 들어와 주세요.
      </p>

      {done ? (
        <p className="mt-8 rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-800">
          요청을 받았습니다. 영업일 기준으로 연락드릴게요.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          <AuthInput
            placeholder="기관명"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
          />
          <AuthInput
            type="email"
            placeholder="담당자 이메일"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
          <textarea
            placeholder="문의 내용 (선택)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-24 w-full rounded-lg border border-line-normal bg-white px-4 py-3 text-[16px] placeholder:text-text-disabled focus:border-accent-700 focus:outline-none"
          />
          {error ? <p className="text-[13px] text-danger-800">{error}</p> : null}
          <AuthButton disabled={!organizationName.trim() || !contactEmail.trim() || busy} onClick={() => void submit()}>
            {busy ? "보내는 중…" : "문의 보내기"}
          </AuthButton>
        </div>
      )}

      <Link href="/admin/login" className="mt-8 text-center text-[13px] text-text-tertiary">
        기관 로그인으로
      </Link>
    </AuthChrome>
  );
}
