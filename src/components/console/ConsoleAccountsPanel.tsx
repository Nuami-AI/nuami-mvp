"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { formatKstDateTime } from "@/lib/datetime";

export interface ConsoleAccountRow {
  email: string;
  kind: "org" | "end" | "console";
  kinds: Kind[];
  accountType: "END_USER" | "ORG_STAFF" | "INTERNAL";
  orgs: Array<{ id: string; nameKo: string; logoSrc: string }>;
  organizationId: string;
  status: string;
  provider: string;
  passwordMustChange: boolean;
  isTest: boolean;
  creditsUsed: number;
  creditsLimit: number;
  lastLoginAt: string | null;
  createdAt: string;
}

type Kind = ConsoleAccountRow["kind"];
type AccountType = ConsoleAccountRow["accountType"];
type SortKey = "email" | "kind" | "org" | "credits" | "status" | "login" | "lastLogin";
type SortDir = "asc" | "desc";

const KIND_RANK: Record<Kind, number> = { end: 0, org: 1, console: 2 };

function kindRank(row: ConsoleAccountRow): number {
  const kinds = row.kinds.length ? row.kinds : [row.kind];
  if (kinds.includes("console")) return KIND_RANK.console;
  if (kinds.includes("org")) return KIND_RANK.org;
  return KIND_RANK.end;
}


function orgName(row: ConsoleAccountRow): string {
  return row.orgs[0]?.nameKo ?? "";
}

function compareAccounts(a: ConsoleAccountRow, b: ConsoleAccountRow, key: SortKey): number {
  switch (key) {
    case "email":
      return a.email.localeCompare(b.email, "ko");
    case "kind":
      return kindRank(a) - kindRank(b);
    case "org": {
      const left = orgName(a);
      const right = orgName(b);
      if (!left && right) return 1;
      if (left && !right) return -1;
      return left.localeCompare(right, "ko");
    }
    case "credits":
      return a.creditsUsed - b.creditsUsed || a.creditsLimit - b.creditsLimit;
    case "status":
      return (a.status === "ACTIVE" ? 0 : 1) - (b.status === "ACTIVE" ? 0 : 1);
    case "login":
      return (a.provider || "이메일").localeCompare(b.provider || "이메일", "ko");
    case "lastLogin":
      return (a.lastLoginAt ?? "").localeCompare(b.lastLoginAt ?? "");
  }
}

const KIND_CHIPS: Array<{
  kind: Kind;
  accountType: AccountType;
  label: string;
  on: string;
}> = [
  { kind: "end", accountType: "END_USER", label: "엔드유저", on: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  { kind: "org", accountType: "ORG_STAFF", label: "기관", on: "bg-slate-100 text-slate-800 ring-slate-200" },
  { kind: "console", accountType: "INTERNAL", label: "콘솔", on: "bg-violet-50 text-violet-800 ring-violet-200" },
];

function toggleAccountKinds(selected: Set<Kind>, kind: Kind): Set<Kind> {
  const next = new Set(selected);
  if (kind === "console") {
    if (next.has("console")) next.delete("console");
    else {
      next.add("console");
      next.add("org");
      next.add("end");
    }
  } else if (next.has(kind)) {
    next.delete(kind);
    next.delete("console");
    if (next.size === 0) next.add("end");
  } else {
    next.add(kind);
  }
  if (next.has("console")) {
    next.add("org");
    next.add("end");
  }
  return next;
}

function orderedKinds(kinds: Iterable<Kind>): Kind[] {
  const set = kinds instanceof Set ? kinds : new Set(kinds);
  return KIND_CHIPS.map((chip) => chip.kind).filter((kind) => set.has(kind));
}

export function ConsoleAccountsPanel({
  rows,
  actorEmail,
  protectedEmail,
  institutions,
  defaultCredits,
  showLastLogin,
}: {
  rows: ConsoleAccountRow[];
  actorEmail: string;
  protectedEmail: string;
  institutions: Array<{ id: string; nameKo: string }>;
  defaultCredits: number;
  showLastLogin: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<ConsoleAccountRow | null>(null);
  const [creditRow, setCreditRow] = useState<ConsoleAccountRow | null>(null);

  const [email, setEmail] = useState("");
  const [kinds, setKinds] = useState<Set<Kind>>(new Set(["end"]));
  const [organizationId, setOrganizationId] = useState("");
  const [creditsLimit, setCreditsLimit] = useState(String(defaultCredits));
  const [isTest, setIsTest] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [headerActions, setHeaderActions] = useState<HTMLElement | null>(null);
  const [kindFilter, setKindFilter] = useState<Set<Kind>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("email");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const needsOrg = kinds.has("org") || kinds.has("console");
  const lockedKinds = kinds.has("console") ? new Set<Kind>(["org", "end"]) : undefined;

  const kindCounts = rows.reduce(
    (acc, row) => {
      for (const kind of row.kinds.length ? row.kinds : [row.kind]) acc[kind] += 1;
      return acc;
    },
    { end: 0, org: 0, console: 0 } satisfies Record<Kind, number>,
  );
  const visibleRows = useMemo(() => {
    const filtered =
      kindFilter.size === 0
        ? rows
        : rows.filter((row) => (row.kinds.length ? row.kinds : [row.kind]).some((kind) => kindFilter.has(kind)));
    const next = [...filtered].sort((a, b) => compareAccounts(a, b, sortKey));
    if (sortDir === "desc") next.reverse();
    return next;
  }, [kindFilter, rows, sortDir, sortKey]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function toggleFilter(kind: Kind) {
    setKindFilter((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  useEffect(() => {
    setHeaderActions(document.getElementById("admin-shell-actions"));
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [openMenu]);

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/console/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as { message?: string; email?: string; tempPassword?: string } | null;
    if (!res.ok) throw new Error(data?.message ?? "처리하지 못했습니다.");
    return data;
  }

  async function createAccount() {
    setBusy("create");
    setError("");
    setNotice("");
    try {
      const data = await post({
        action: "create",
        email,
        kinds: orderedKinds(kinds),
        organizationId,
        creditsLimit: Number(creditsLimit),
        isTest,
      });
      setNotice(`${data?.email ?? email} 추가됨 · 임시 비밀번호 ${data?.tempPassword ?? "1234"}`);
      setEmail("");
      setKinds(new Set(["end"]));
      setOrganizationId("");
      setCreditsLimit(String(defaultCredits));
      setIsTest(false);
      setAddOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "추가하지 못했습니다.");
    } finally {
      setBusy("");
    }
  }

  async function run(action: string, row: ConsoleAccountRow, extra?: Record<string, unknown>) {
    const confirms: Record<string, string> = {
      reset: `${row.email} 비밀번호를 1234로 초기화할까요?`,
      deactivate: `${row.email} 계정을 비활성화할까요?`,
      activate: `${row.email} 계정을 다시 활성화할까요?`,
      delete: `${row.email} 계정을 삭제할까요? 되돌릴 수 없습니다.`,
    };
    if (confirms[action] && !window.confirm(confirms[action])) return;
    setOpenMenu(null);
    setBusy(row.email + action);
    setError("");
    setNotice("");
    try {
      const data = await post({ action, email: row.email, ...extra });
      if (action === "reset") setNotice(`${data?.email ?? row.email} 비밀번호를 1234로 초기화했습니다.`);
      else if (action === "deactivate") setNotice(`${row.email} 계정을 비활성화했습니다.`);
      else if (action === "activate") setNotice(`${row.email} 계정을 활성화했습니다.`);
      else if (action === "delete") setNotice(`${row.email} 계정을 삭제했습니다.`);
      else if (action === "update") setNotice(`${row.email} 계정을 수정했습니다.`);
      else if (action === "credits") setNotice(`${row.email} 크레딧을 변경했습니다.`);
      setEditRow(null);
      setCreditRow(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리하지 못했습니다.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-4">
      {headerActions
        ? createPortal(
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white"
            >
              계정 추가
            </button>,
            headerActions,
          )
        : null}
      {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
      {notice ? <p className="rounded-lg bg-gray-50 px-3 py-2 text-[13px] text-gray-800">{notice}</p> : null}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
          <KindChips selected={kindFilter} counts={kindCounts} onToggle={toggleFilter} />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <SortTh label="이메일" column="email" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortTh label="구분" column="kind" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortTh label="소속 기관" column="org" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortTh label="크레딧" column="credits" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortTh label="상태" column="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortTh label="로그인" column="login" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              {showLastLogin ? (
                <SortTh label="마지막 로그인" column="lastLogin" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              ) : null}
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={showLastLogin ? 8 : 7} className="px-4 py-10 text-center text-sm text-gray-400">
                  {rows.length === 0 ? "계정이 없습니다." : "선택한 구분에 해당하는 계정이 없습니다."}
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => {
                const locked = row.email.toLowerCase() === protectedEmail || row.email.toLowerCase() === actorEmail.toLowerCase();
                return (
                  <tr key={row.email} className={row.status !== "ACTIVE" ? "bg-gray-50" : undefined}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex flex-wrap gap-1">
                        {orderedKinds(row.kinds.length ? row.kinds : [row.kind]).map((kind) => (
                          <KindBadge key={kind} kind={kind} />
                        ))}
                      </span>
                      {row.isTest ? (
                        <span className="ml-2 text-[11px] text-sky-700">테스트용</span>
                      ) : row.passwordMustChange ? (
                        <span className="ml-2 text-[11px] text-amber-700">비번 변경 필요</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {row.orgs.length ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {row.orgs.map((org, index) => (
                            <OrgMark
                              key={`${org.id}-${org.nameKo}-${index}`}
                              name={org.nameKo}
                              src={org.logoSrc}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-gray-700">
                      {row.creditsUsed}/{row.creditsLimit}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{row.provider ? row.provider : "이메일"}</td>
                    {showLastLogin ? (
                      <td className="px-4 py-3 text-xs tabular-nums text-gray-500">
                        {formatKstDateTime(row.lastLoginAt)}
                      </td>
                    ) : null}
                    <td className="px-2 py-2 text-right">
                      <KebabMenu
                        open={openMenu === row.email}
                        onToggle={() => setOpenMenu((id) => (id === row.email ? null : row.email))}
                      >
                        <MenuItem label="수정" onClick={() => { setOpenMenu(null); setEditRow(row); }} />
                        <MenuItem label="크레딧" onClick={() => { setOpenMenu(null); setCreditRow(row); }} />
                        {row.status === "ACTIVE" ? (
                          <MenuItem label="비밀번호 초기화" onClick={() => void run("reset", row)} />
                        ) : null}
                        {row.status === "ACTIVE" && !locked ? (
                          <MenuItem label="비활성화" onClick={() => void run("deactivate", row)} />
                        ) : null}
                        {row.status !== "ACTIVE" ? (
                          <MenuItem label="활성화" onClick={() => void run("activate", row)} />
                        ) : null}
                        {!locked ? (
                          <MenuItem label="삭제" danger onClick={() => void run("delete", row)} />
                        ) : null}
                      </KebabMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {addOpen ? (
        <AccountDialog title="계정 추가" onClose={() => setAddOpen(false)}>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void createAccount();
            }}
          >
            <p className="text-[12px] text-gray-400">
              임시 비밀번호는 1234입니다. 테스트용이 아니면 다음 로그인에서 바꾸게 됩니다.
            </p>
            <input
              type="email"
              required
              placeholder="이메일"
              aria-label="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
            />
            <div>
              <p className="mb-1.5 text-[12px] font-medium text-gray-500">구분 · 여러 개 선택 가능</p>
              <KindChips
                selected={kinds}
                locked={lockedKinds}
                onToggle={(kind) => {
                  const next = toggleAccountKinds(kinds, kind);
                  setKinds(next);
                  if (!next.has("org") && !next.has("console")) setOrganizationId("");
                }}
              />
              {kinds.has("console") ? (
                <p className="mt-1.5 text-[12px] text-gray-400">콘솔을 고르면 기관·엔드유저가 함께 선택됩니다. 콘솔 권한은 슈퍼 어드민만 부여합니다.</p>
              ) : null}
            </div>
            {needsOrg ? (
              <label className="block text-[12px] font-medium text-gray-500">
                기관
                <select
                  required
                  aria-label="기관"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900"
                >
                  <option value="">기관 선택</option>
                  {institutions.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.nameKo}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="block text-[12px] font-medium text-gray-500">
              크레딧 한도
              <input
                type="number"
                min={1}
                max={10000}
                aria-label="크레딧 한도"
                value={creditsLimit}
                onChange={(e) => setCreditsLimit(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900"
              />
            </label>
            <TestAccountCheck checked={isTest} onChange={setIsTest} />
            {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={!email.trim() || (needsOrg && !organizationId) || busy === "create"}
              className="h-10 w-full rounded-lg bg-gray-900 text-sm font-medium text-white disabled:bg-gray-300"
            >
              {busy === "create" ? "추가 중…" : "계정 추가"}
            </button>
          </form>
        </AccountDialog>
      ) : null}

      {editRow ? (
        <AccountDialog title="계정 수정" onClose={() => setEditRow(null)}>
          <EditForm
            row={editRow}
            institutions={institutions}
            busy={busy === editRow.email + "update"}
            onSave={(payload) => void run("update", editRow, payload)}
          />
        </AccountDialog>
      ) : null}

      {creditRow ? (
        <AccountDialog title="크레딧 변경" onClose={() => setCreditRow(null)}>
          <CreditsForm
            row={creditRow}
            busy={busy === creditRow.email + "credits"}
            onSave={(payload) => void run("credits", creditRow, payload)}
          />
        </AccountDialog>
      ) : null}
    </div>
  );
}

function EditForm({
  row,
  institutions,
  busy,
  onSave,
}: {
  row: ConsoleAccountRow;
  institutions: Array<{ id: string; nameKo: string }>;
  busy: boolean;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const [kinds, setKinds] = useState<Set<Kind>>(() => {
    const next = new Set(row.kinds.length ? row.kinds : [row.kind]);
    if (next.has("console")) {
      next.add("org");
      next.add("end");
    }
    return next;
  });
  const [organizationId, setOrganizationId] = useState(row.organizationId);
  const [creditsLimit, setCreditsLimit] = useState(String(row.creditsLimit));
  const [isTest, setIsTest] = useState(row.isTest);
  const needsOrg = kinds.has("org") || kinds.has("console");
  const lockedKinds = kinds.has("console") ? new Set<Kind>(["org", "end"]) : undefined;
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          kinds: orderedKinds(kinds),
          organizationId,
          creditsLimit: Number(creditsLimit),
          isTest,
        });
      }}
    >
      <p className="text-[13px] text-gray-600">{row.email}</p>
      <div>
        <p className="mb-1.5 text-[12px] font-medium text-gray-500">구분 · 여러 개 선택 가능</p>
        <KindChips
          selected={kinds}
          locked={lockedKinds}
          onToggle={(kind) => {
            const next = toggleAccountKinds(kinds, kind);
            setKinds(next);
            if (!next.has("org") && !next.has("console")) setOrganizationId("");
          }}
        />
        {kinds.has("console") ? (
          <p className="mt-1.5 text-[12px] text-gray-400">콘솔을 고르면 기관·엔드유저가 함께 선택됩니다.</p>
        ) : null}
      </div>
      {needsOrg ? (
        <label className="block text-[12px] font-medium text-gray-500">
          기관
          <select
            required
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900"
          >
            <option value="">기관 선택</option>
            {institutions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nameKo}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block text-[12px] font-medium text-gray-500">
        크레딧 한도
        <input
          type="number"
          min={1}
          max={10000}
          value={creditsLimit}
          onChange={(e) => setCreditsLimit(e.target.value)}
          className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900"
        />
      </label>
      <TestAccountCheck checked={isTest} onChange={setIsTest} />
      <button
        type="submit"
        disabled={busy || (needsOrg && !organizationId)}
        className="h-10 w-full rounded-lg bg-gray-900 text-sm font-medium text-white disabled:bg-gray-300"
      >
        {busy ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}

function CreditsForm({
  row,
  busy,
  onSave,
}: {
  row: ConsoleAccountRow;
  busy: boolean;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const [creditsLimit, setCreditsLimit] = useState(String(row.creditsLimit));
  const [resetUsed, setResetUsed] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ creditsLimit: Number(creditsLimit), resetUsed });
      }}
    >
      <p className="text-[13px] text-gray-600">
        {row.email}
        <span className="ml-2 text-gray-400">사용 {row.creditsUsed} / 한도 {row.creditsLimit}</span>
      </p>
      <label className="block text-[12px] font-medium text-gray-500">
        크레딧 한도
        <input
          type="number"
          min={1}
          max={10000}
          value={creditsLimit}
          onChange={(e) => setCreditsLimit(e.target.value)}
          className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900"
        />
      </label>
      <label className="flex items-center gap-2 text-[13px] text-gray-700">
        <input type="checkbox" checked={resetUsed} onChange={(e) => setResetUsed(e.target.checked)} />
        사용 횟수도 0으로 초기화
      </label>
      <button
        type="submit"
        disabled={busy}
        className="h-10 w-full rounded-lg bg-gray-900 text-sm font-medium text-white disabled:bg-gray-300"
      >
        {busy ? "저장 중…" : "크레딧 저장"}
      </button>
    </form>
  );
}

function AccountDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-gray-700">
            닫기
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TestAccountCheck({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-[13px] text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5"
      />
      <span>
        테스트용
        <span className="mt-0.5 block text-[12px] text-gray-400">
          체크하면 임시 비밀번호로 로그인해도 변경 안내를 하지 않습니다.
        </span>
      </span>
    </label>
  );
}

function KindChips({
  selected,
  onToggle,
  counts,
  locked,
}: {
  selected: Set<Kind>;
  onToggle: (kind: Kind) => void;
  counts?: Record<Kind, number>;
  locked?: Set<Kind>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="계정 구분">
      {KIND_CHIPS.map((chip) => {
        const active = selected.has(chip.kind);
        const count = counts?.[chip.kind];
        const isLocked = locked?.has(chip.kind) === true;
        return (
          <button
            key={chip.kind}
            type="button"
            aria-pressed={active}
            disabled={isLocked}
            onClick={() => onToggle(chip.kind)}
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 transition-colors ${
              active ? chip.on : "bg-white text-gray-500 ring-gray-200 hover:bg-gray-50"
            } ${isLocked ? "cursor-default" : ""}`}
          >
            {chip.label}
            {count != null ? <span className="ml-1 tabular-nums opacity-70">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function OrgMark({ name, src }: { name?: string; src?: string }) {
  const [failed, setFailed] = useState(false);
  const label = name?.trim() || "기관";
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-1.5 py-0.5 ring-1 ring-gray-100">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          width={14}
          height={14}
          className="h-3.5 w-3.5 shrink-0 object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm bg-slate-200 text-[8px] font-bold text-slate-600">
          {label.slice(0, 1)}
        </span>
      )}
      <span className="text-xs text-gray-600">{label}</span>
    </span>
  );
}

function SortTh({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === column;
  return (
    <th className="px-4 py-3 text-left">
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide ${
          active ? "text-gray-800" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        {label}
        <span className="text-[10px] tabular-nums" aria-hidden>
          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
        active
          ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
          : "bg-gray-100 text-gray-500 ring-gray-200"
      }`}
    >
      {active ? "사용 중" : "비활성"}
    </span>
  );
}

function KindBadge({ kind }: { kind: Kind }) {
  const chip = KIND_CHIPS.find((row) => row.kind === kind);
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${chip?.on ?? ""}`}>
      {chip?.label ?? kind}
    </span>
  );
}

function KebabMenu({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const button = buttonRef.current;
    const menu = menuRef.current;
    if (!button || !menu) return;
    const rect = button.getBoundingClientRect();
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const gap = 4;
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
    const openUp = rect.bottom + gap + height > window.innerHeight - 8 && rect.top - gap - height > 8;
    const top = openUp ? rect.top - height - gap : rect.bottom + gap;
    setPos({ top, left });
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="계정 관리"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      >
        <KebabIcon />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              onClick={(event) => event.stopPropagation()}
              style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: "hidden" }}
              className="fixed z-50 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function MenuItem({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full px-3 py-2 text-left text-[13px] hover:bg-gray-50 ${
        danger ? "text-red-600" : "text-gray-800"
      }`}
    >
      {label}
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
