"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AuthButton, AuthChrome, AuthInput, AuthTitle } from "@/components/login/AuthChrome";

export default function AdminPasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    if (password !== confirm) {
      setBusy(false);
      setError("새 비밀번호가 서로 달라요.");
      return;
    }
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change", currentPassword, password }),
    });
    const data = (await res.json().catch(() => null)) as { message?: string; redirect?: string } | null;
    setBusy(false);
    if (!res.ok) {
      setError(data?.message ?? "비밀번호를 바꾸지 못했어요.");
      return;
    }
    router.replace(data?.redirect || "/admin");
  }

  return (
    <AuthChrome title="비밀번호 변경">
      <AuthTitle line1="임시 비밀번호를" line2="바꿔 주세요." />
      <p className="mt-4 text-[14px] leading-relaxed text-text-secondary">
        뉴아미가 안내한 임시 비밀번호(1234)로 들어오셨습니다. 8자 이상의 새 비밀번호로 바꾼 뒤 기관 관리를 시작할 수 있어요.
      </p>
      <div className="mt-8 space-y-3">
        <AuthInput
          type="password"
          placeholder="현재 비밀번호"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
        <AuthInput
          type="password"
          placeholder="새 비밀번호 (8자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <AuthInput
          type="password"
          placeholder="새 비밀번호 확인"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
        {error ? <p className="text-[13px] text-danger-800">{error}</p> : null}
        <AuthButton disabled={!currentPassword || !password || !confirm || busy} onClick={() => void submit()}>
          {busy ? "저장 중…" : "비밀번호 저장"}
        </AuthButton>
      </div>
    </AuthChrome>
  );
}
