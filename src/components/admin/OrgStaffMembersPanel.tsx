"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { HelpTip } from "@/components/ui/help-tip";
import { orgRoleHelp, orgRoleLabel, orgStatusLabel } from "@/lib/auth/roles";

interface Member {
  id: string;
  email: string;
  role: string;
  status: string;
}

export function OrgStaffMembersPanel({
  organizationId,
  members,
  actorEmail,
  variant = "institution",
}: {
  organizationId: string;
  members: Member[];
  actorEmail: string;
  variant?: "institution" | "console";
}) {
  const router = useRouter();
  const emailInputId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(variant === "console" ? "ORG_ADMIN" : "ORG_VIEWER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<{ email: string; tempPassword: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    function close() {
      setOpenMenuId(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenuId(null);
    }
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [openMenuId]);

  const actionUrl = (memberId: string) =>
    variant === "console"
      ? `/api/console/organizations/${organizationId}/staff/${memberId}`
      : `/api/admin/institutions/${organizationId}/staff/${memberId}`;

  async function addMember() {
    setBusy(true);
    setError("");
    setIssued(null);
    setNotice("");
    const res = await fetch(
      variant === "console" ? "/api/console/staff" : `/api/admin/institutions/${organizationId}/staff`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          variant === "console" ? { organizationId, email, role } : { email, role },
        ),
      },
    );
    const data = (await res.json().catch(() => null)) as {
      message?: string;
      email?: string;
      tempPassword?: string;
    } | null;
    setBusy(false);
    if (!res.ok) {
      setError(data?.message ?? "추가하지 못했습니다.");
      return;
    }
    setIssued({ email: data?.email ?? email, tempPassword: data?.tempPassword ?? "1234" });
    setEmail("");
    router.refresh();
  }

  async function runAction(memberId: string, action: "reset" | "deactivate" | "activate" | "delete") {
    const confirms: Record<typeof action, string> = {
      reset: "비밀번호를 1234로 초기화할까요? 다음 로그인에서 변경해야 합니다.",
      deactivate: "이 멤버를 비활성화할까요? 기관 관리 화면에 다시 들어올 수 없습니다.",
      activate: "이 멤버를 다시 활성화할까요?",
      delete: "이 기관에서 계정을 삭제할까요? 다른 기관 소속이 없으면 로그인 계정도 삭제됩니다.",
    };
    if (!window.confirm(confirms[action])) return;
    setError("");
    setNotice("");
    setOpenMenuId(null);
    const res = await fetch(actionUrl(memberId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await res.json().catch(() => null)) as { message?: string; email?: string } | null;
    if (!res.ok) {
      setError(data?.message ?? "처리하지 못했습니다.");
      return;
    }
    if (action === "reset") {
      setNotice(`${data?.email ?? ""} 비밀번호를 1234로 초기화했습니다.`);
    } else if (action === "deactivate") {
      setNotice(`${data?.email ?? ""} 계정을 비활성화했습니다.`);
    } else if (action === "activate") {
      setNotice(`${data?.email ?? ""} 계정을 활성화했습니다.`);
    } else {
      setNotice(`${data?.email ?? ""} 계정을 삭제했습니다.`);
    }
    router.refresh();
  }

  async function changeRole(memberId: string, nextRole: string, currentRole: string) {
    if (nextRole === currentRole) {
      setOpenMenuId(null);
      return;
    }
    if (!window.confirm(`역할을 ${orgRoleLabel(nextRole)}(으)로 바꿀까요?`)) return;
    setError("");
    setNotice("");
    setOpenMenuId(null);
    const res = await fetch(actionUrl(memberId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "role", role: nextRole }),
    });
    const data = (await res.json().catch(() => null)) as { message?: string; email?: string; role?: string } | null;
    if (!res.ok) {
      setError(data?.message ?? "역할을 바꾸지 못했습니다.");
      return;
    }
    setNotice(`${data?.email ?? ""} 역할을 ${orgRoleLabel(data?.role ?? nextRole)}(으)로 바꿨습니다.`);
    router.refresh();
  }

  function focusAdd() {
    setOpenMenuId(null);
    emailRef.current?.focus();
    emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">{variant === "console" ? "기관 계정 추가" : "멤버 추가"}</h2>
        <p className="mt-1 text-[13px] text-gray-500">
          {variant === "console"
            ? "담당자 이메일을 넣으면 기관 계정이 만들어집니다. 임시 비밀번호는 1234입니다."
            : "대표와 관리자만 멤버를 추가하고 역할을 바꿀 수 있습니다. 점 세 개 메뉴에서 역할 변경·초기화·비활성화·활성화·삭제를 합니다."}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            id={emailInputId}
            ref={emailRef}
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm"
          />
          <div className="flex items-center gap-1.5">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label="역할"
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
            >
              {variant === "console" ? <option value="ORG_OWNER">{orgRoleLabel("ORG_OWNER")}</option> : null}
              <option value="ORG_ADMIN">{orgRoleLabel("ORG_ADMIN")}</option>
              <option value="ORG_EDITOR">{orgRoleLabel("ORG_EDITOR")}</option>
              <option value="ORG_VIEWER">{orgRoleLabel("ORG_VIEWER")}</option>
            </select>
            <HelpTip label={`${orgRoleLabel(role)} 역할 설명`} text={orgRoleHelp(role)} />
          </div>
          <button
            type="button"
            disabled={!email.trim() || busy}
            onClick={() => void addMember()}
            className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white disabled:bg-gray-300"
          >
            {busy ? "추가 중…" : "추가"}
          </button>
        </div>
        {error ? <p className="mt-2 text-[13px] text-red-600">{error}</p> : null}
        {notice ? <p className="mt-2 text-[13px] text-gray-700">{notice}</p> : null}
        {issued ? (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-[13px] text-gray-800">
            추가됨: <span className="font-medium">{issued.email}</span>
            {" · "}임시 비밀번호 <span className="font-mono font-semibold">{issued.tempPassword}</span>
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-gray-400">이메일</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-gray-400">역할</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-gray-400">상태</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                  아직 기관 계정이 없습니다.
                </td>
              </tr>
            ) : (
              members.map((row) => {
                const self = row.email === actorEmail.toLowerCase();
                const active = row.status === "ACTIVE";
                const canChangeRole = active && !self && (variant === "console" || row.role !== "ORG_OWNER");
                const roleChoices =
                  variant === "console"
                    ? (["ORG_OWNER", "ORG_ADMIN", "ORG_EDITOR", "ORG_VIEWER"] as const)
                    : (["ORG_ADMIN", "ORG_EDITOR", "ORG_VIEWER"] as const);
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.email}</td>
                    <td className="overflow-visible px-4 py-3 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1.5">
                        {orgRoleLabel(row.role)}
                        <HelpTip
                          label={`${orgRoleLabel(row.role)} 역할 설명`}
                          text={orgRoleHelp(row.role)}
                          side="top"
                        />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{orgStatusLabel(row.status)}</td>
                    <td className="relative px-2 py-2 text-right">
                      <button
                        type="button"
                        aria-label="계정 관리"
                        aria-expanded={openMenuId === row.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId((id) => (id === row.id ? null : row.id));
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      >
                        <KebabIcon />
                      </button>
                      {openMenuId === row.id ? (
                        <div
                          role="menu"
                          onClick={(event) => event.stopPropagation()}
                          className="absolute right-2 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                        >
                          <MenuItem label="추가" onClick={focusAdd} />
                          {canChangeRole ? (
                            <>
                              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                역할 변경
                              </p>
                              {roleChoices.map((value) => (
                                <MenuItem
                                  key={value}
                                  label={orgRoleLabel(value)}
                                  current={value === row.role}
                                  onClick={() => void changeRole(row.id, value, row.role)}
                                />
                              ))}
                            </>
                          ) : null}
                          {active ? (
                            <MenuItem label="초기화" onClick={() => void runAction(row.id, "reset")} />
                          ) : null}
                          {active && !self ? (
                            <MenuItem label="비활성화" onClick={() => void runAction(row.id, "deactivate")} />
                          ) : null}
                          {!active ? (
                            <MenuItem label="활성화" onClick={() => void runAction(row.id, "activate")} />
                          ) : null}
                          {!self ? (
                            <MenuItem
                              label="계정 삭제"
                              danger
                              onClick={() => void runAction(row.id, "delete")}
                            />
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  danger = false,
  current = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  current?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-gray-50 ${
        danger ? "text-red-600" : "text-gray-800"
      }`}
    >
      {label}
      {current ? <span className="text-[11px] text-gray-400">현재</span> : null}
    </button>
  );
}

function KebabIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <circle cx="8" cy="3" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="8" cy="13" r="1.4" />
    </svg>
  );
}
