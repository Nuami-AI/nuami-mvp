"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  next: string;
  title?: string;
  description?: string;
  currentLabel?: string;
  nextLabel?: string;
  confirmLabel?: string;
  saveLabel?: string;
  mismatchLabel?: string;
}

export function ChangePasswordForm({
  next,
  title = "비밀번호 변경",
  description = "현재 비밀번호를 확인한 뒤 8자 이상의 새 비밀번호로 바꿉니다.",
  currentLabel = "현재 비밀번호",
  nextLabel = "새 비밀번호 (8자 이상)",
  confirmLabel = "새 비밀번호 확인",
  saveLabel = "비밀번호 저장",
  mismatchLabel = "새 비밀번호가 서로 달라요.",
}: Props) {
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
      setError(mismatchLabel);
      return;
    }
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change", currentPassword, password, next }),
    });
    const data = (await res.json().catch(() => null)) as { message?: string; redirect?: string } | null;
    setBusy(false);
    if (!res.ok) {
      setError(data?.message ?? "비밀번호를 바꾸지 못했어요.");
      return;
    }
    router.replace(data?.redirect || next);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {title ? <p className="text-[14px] font-semibold text-text-primary">{title}</p> : null}
      {description ? <p className="text-[13px] leading-relaxed text-text-secondary">{description}</p> : null}
      <input
        type="password"
        placeholder={currentLabel}
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
        className="h-11 w-full rounded-xl border border-line-neutral px-3 text-[14px]"
      />
      <input
        type="password"
        placeholder={nextLabel}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        className="h-11 w-full rounded-xl border border-line-neutral px-3 text-[14px]"
      />
      <input
        type="password"
        placeholder={confirmLabel}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
        className="h-11 w-full rounded-xl border border-line-neutral px-3 text-[14px]"
      />
      {error ? <p className="text-[13px] text-danger-800">{error}</p> : null}
      <button
        type="button"
        disabled={!currentPassword || !password || !confirm || busy}
        onClick={() => void submit()}
        className="h-11 w-full rounded-xl bg-accent-700 text-[14px] font-semibold text-white disabled:opacity-50"
      >
        {busy ? "저장 중…" : saveLabel}
      </button>
    </div>
  );
}
