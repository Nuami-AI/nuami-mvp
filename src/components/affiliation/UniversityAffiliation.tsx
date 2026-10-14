"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/lib/i18n";
import { INSTITUTION_CATALOG, institutionLogoSrc } from "@/lib/institution/catalog";
import { loadPreferences, savePreferences } from "@/lib/user/preferences";

interface InstitutionOption {
  id: string;
  nameKo: string;
  nameEn: string;
  aliases: string[];
  city: string;
  knowledgeCount: number;
  /** catalog의 logoFile 필드 — API가 내려주면 사용 */
  logoFile?: string;
}

interface Props {
  mode?: "modal" | "settings" | "page";
}

function getUniversityLogoUrl(row: InstitutionOption): string {
  const file = row.logoFile || row.id;
  return institutionLogoSrc(row.city, file);
}

function UniversitySymbol({ row, size = "md" }: { row: InstitutionOption; size?: "sm" | "md" }) {
  const url = getUniversityLogoUrl(row);
  const [failed, setFailed] = useState(false);
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (failed) {
    return (
      <div className={`${dim} shrink-0 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center text-[11px] font-bold text-accent-700`}>
        {row.nameKo.slice(0, 1)}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`${row.nameKo} symbol`}
      className={`${dim} shrink-0 object-contain rounded-xl bg-white border border-line-neutral p-1`}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}

export default function UniversityAffiliation({ mode = "modal" }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(mode === "settings" || mode === "page");
  const [editOpen, setEditOpen] = useState(mode === "page");
  const [menuOpen, setMenuOpen] = useState(false);
  const [step, setStep] = useState<"ask" | "select" | "verify">(mode === "modal" ? "ask" : "select");
  const [query, setQuery] = useState("");
  const [institutions] = useState<InstitutionOption[]>(() =>
    INSTITUTION_CATALOG.filter((row) => row.type === "university").map((row) => ({
      id: row.id,
      nameKo: row.nameKo,
      nameEn: row.nameEn,
      aliases: row.aliases,
      city: row.city,
      knowledgeCount: 0,
      logoFile: row.logoFile,
    })),
  );
  const [savedId, setSavedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const syncFromPrefs = () => {
    const prefs = loadPreferences();
    const nextId = prefs.universityVerified ? prefs.universityId : null;
    setSavedId(nextId);
    setSelectedId(nextId);
    setVerified(prefs.universityVerified === true);
  };

  useEffect(() => {
    if (mode === "settings" || mode === "page") {
      syncFromPrefs();
      setOpen(true);
      if (mode === "page") setEditOpen(true);
      return;
    }
    const prefs = loadPreferences();
    if (!prefs.universityAsked) setOpen(true);
  }, [mode]);

  useEffect(() => {
    const sync = () => {
      const prefs = loadPreferences();
      if (mode === "settings" || mode === "page") {
        const nextId = prefs.universityVerified ? prefs.universityId : null;
        setSavedId(nextId);
        setSelectedId(nextId);
        setVerified(prefs.universityVerified === true);
        return;
      }
      if (!prefs.universityAsked) setOpen(true);
      else setOpen(false);
    };
    window.addEventListener("nuami-storage-scope", sync);
    return () => window.removeEventListener("nuami-storage-scope", sync);
  }, [mode]);

  const filteredInstitutions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return institutions;
    return institutions.filter((row) =>
      [row.nameKo, row.nameEn, ...row.aliases].some((value) => value.toLowerCase().includes(q)),
    );
  }, [institutions, query]);

  const selectedRow = useMemo(() => {
    if (!selectedId) return null;
    return institutions.find((row) => row.id === selectedId) ?? null;
  }, [institutions, selectedId]);

  const savedRow = useMemo(() => {
    if (!savedId) return null;
    return institutions.find((row) => row.id === savedId) ?? null;
  }, [institutions, savedId]);

  const persist = (next: {
    universityId: string | null;
    universityName: string | null;
    universityAsked: boolean;
    universityVerified: boolean;
  }) => {
    const prefs = loadPreferences();
    savePreferences({ ...prefs, ...next });
  };

  const closeEdit = () => {
    setEditOpen(false);
    setQuery("");
    setStudentId("");
    setVerifyError(null);
    setStep("select");
    syncFromPrefs();
  };

  const openEdit = () => {
    setMenuOpen(false);
    setQuery("");
    setStudentId("");
    setVerifyError(null);
    setSelectedId(null);
    setStep("select");
    setEditOpen(true);
  };

  const finishNone = () => {
    persist({ universityId: null, universityName: null, universityAsked: true, universityVerified: false });
    void fetch("/api/me/affiliation", { method: "DELETE" });
    if (mode === "modal") setOpen(false);
    if (mode !== "page") setEditOpen(false);
    setMenuOpen(false);
    setSavedId(null);
    setSelectedId(null);
    setVerified(false);
    setStudentId("");
    setVerifyError(null);
    setQuery("");
    setStep(mode === "modal" ? "ask" : "select");
  };

  const pickUniversity = (row: InstitutionOption) => {
    setSelectedId(row.id);
    setStudentId("");
    setVerifyError(null);
    setVerified(false);
    setStep("verify");
  };

  const submitStudentId = async () => {
    const row = selectedRow;
    if (!row || verifying) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch("/api/me/affiliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: row.id, studentId }),
      });
      if (res.ok) {
        persist({
          universityId: row.id,
          universityName: row.nameKo,
          universityAsked: true,
          universityVerified: true,
        });
        setVerified(true);
        setSavedId(row.id);
        if (mode === "modal") setOpen(false);
        if (mode === "settings") {
          setEditOpen(false);
          setQuery("");
          setStudentId("");
          setVerifyError(null);
          setStep("select");
        }
        return;
      }
      persist({ universityId: null, universityName: null, universityAsked: true, universityVerified: false });
      void fetch("/api/me/affiliation", { method: "DELETE" });
      setVerified(false);
      setVerifyError(t("affiliation.verifyFail"));
    } catch {
      setVerified(false);
      setVerifyError(t("affiliation.verifyFail"));
    } finally {
      setVerifying(false);
    }
  };

  const picker = (
    <div className="mt-4 space-y-3">
      <div className="space-y-2">
        {selectedRow && (mode !== "page" || step === "verify") ? (
          <div className="w-full rounded-xl border border-line-neutral bg-white px-3 py-2.5 flex items-center gap-3">
            <UniversitySymbol row={selectedRow} />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-text-primary truncate">{selectedRow.nameKo}</p>
              <p className="text-[11px] text-text-tertiary truncate">
                {verified ? t("affiliation.verified") : selectedRow.nameEn}
              </p>
            </div>
          </div>
        ) : null}

        {step === "verify" && selectedRow ? (
          <button
            type="button"
            onClick={() => {
              setStep("select");
              setStudentId("");
              setVerifyError(null);
              setVerified(false);
            }}
            className="text-[12px] text-text-tertiary"
          >
            {t("affiliation.pickOther")}
          </button>
        ) : (
          <div className="rounded-xl border border-line-normal bg-white p-3">
            <label htmlFor="university-search" className="sr-only">
              {t("affiliation.search")}
            </label>
            <input
              id="university-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("affiliation.search")}
              autoComplete="off"
              autoFocus={step === "select"}
              className="w-full rounded-lg border border-line-neutral px-3 py-2 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-700"
            />

            <div className="mt-2 max-h-56 overflow-auto space-y-1" role="listbox" aria-label={t("affiliation.settingsTitle")}>
              {filteredInstitutions.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-text-tertiary">{t("affiliation.searchEmpty")}</p>
              ) : (
                filteredInstitutions.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    role="option"
                    aria-selected={selectedId === row.id}
                    onClick={() => pickUniversity(row)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left flex items-center gap-3 ${
                      selectedId === row.id ? "border-accent-700 bg-accent-50" : "border-line-neutral bg-white"
                    }`}
                  >
                    <UniversitySymbol row={row} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-text-primary truncate">{row.nameKo}</p>
                      <p className="text-[11px] text-text-tertiary truncate">{row.city} · {row.nameEn}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {step === "verify" && selectedRow && !verified ? (
        <div className="space-y-2">
          <p className="text-[13px] font-semibold text-text-primary">{t("affiliation.studentId")}</p>
          <input
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value);
              setVerifyError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitStudentId();
            }}
            placeholder={t("affiliation.studentIdPlaceholder")}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-xl border border-line-neutral px-3 py-2.5 text-[14px]"
          />
          {verifyError ? (
            <p className="text-[12px] text-danger-800 leading-relaxed">{verifyError}</p>
          ) : (
            <p className="text-[12px] text-text-tertiary leading-relaxed">{t("affiliation.verifyHint")}</p>
          )}
          <button
            type="button"
            disabled={!studentId.trim() || verifying}
            onClick={() => void submitStudentId()}
            className="w-full rounded-xl bg-accent-700 py-3 text-[14px] font-semibold text-white disabled:opacity-50"
          >
            {t("affiliation.verifyCta")}
          </button>
          {verifyError ? (
            <button type="button" onClick={finishNone} className="w-full text-[12px] text-text-tertiary">
              {t("affiliation.continueWithout")}
            </button>
          ) : null}
        </div>
      ) : null}

      {verified && selectedRow && mode !== "page" ? (
        <p className="text-[12px] font-semibold text-accent-700">{t("affiliation.verifyOk")}</p>
      ) : null}
    </div>
  );

  if (mode === "page") {
    return (
      <div>
        {savedRow ? (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-line-neutral bg-white px-3 py-2.5">
            <UniversitySymbol row={savedRow} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-text-primary">{savedRow.nameKo}</p>
              <p className="truncate text-[11px] text-text-tertiary">{verified ? t("affiliation.verified") : savedRow.nameEn}</p>
            </div>
          </div>
        ) : null}
        {picker}
        {savedRow ? (
          <button type="button" onClick={finishNone} className="mt-4 text-[13px] text-danger-800">
            {t("affiliation.delete")}
          </button>
        ) : null}
      </div>
    );
  }

  if (mode === "settings") {
    return (
      <>
        <div>
          <p className="text-[13px] font-semibold text-text-secondary mb-1">{t("affiliation.settingsTitle")}</p>
          <div className="flex h-12 items-center gap-2 rounded-xl border border-line-normal bg-white px-3">
            {savedRow ? (
              <>
                <UniversitySymbol row={savedRow} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-text-primary">{savedRow.nameKo}</p>
                </div>
              </>
            ) : (
              <p className="min-w-0 flex-1 truncate text-[14px] text-text-tertiary">{t("affiliation.empty")}</p>
            )}
            <AffiliationKebab
              open={menuOpen}
              onToggle={() => setMenuOpen((v) => !v)}
              changeLabel={t("affiliation.change")}
              deleteLabel={t("affiliation.delete")}
              onChange={openEdit}
              onDelete={finishNone}
            />
          </div>
        </div>
        {editOpen
          ? createPortal(
              <div
                className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4"
                onClick={closeEdit}
              >
                <div
                  className="w-full max-w-md max-h-[min(90vh,40rem)] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[16px] font-bold text-text-primary">{t("affiliation.editTitle")}</p>
                    <button
                      type="button"
                      onClick={closeEdit}
                      aria-label={t("affiliation.close")}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-muted hover:text-text-primary"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  {picker}
                </div>
              </div>,
              document.body,
            )
          : null}
      </>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/40 p-4">
      <div className="rounded-2xl bg-white p-5 shadow-xl w-full max-w-md">
        <p className="text-[16px] font-bold text-text-primary">{t("affiliation.title")}</p>
        {step === "ask" ? (
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setStep("select")}
              className="flex-1 rounded-xl bg-accent-700 py-3 text-[14px] font-semibold text-white"
            >
              {t("affiliation.yes")}
            </button>
            <button
              type="button"
              onClick={finishNone}
              className="flex-1 rounded-xl border border-line-neutral py-3 text-[14px] font-semibold text-text-secondary"
            >
              {t("affiliation.no")}
            </button>
          </div>
        ) : (
          picker
        )}
      </div>
    </div>
  );
}

function AffiliationKebab({
  open,
  onToggle,
  changeLabel,
  deleteLabel,
  onChange,
  onDelete,
}: {
  open: boolean;
  onToggle: () => void;
  changeLabel: string;
  deleteLabel: string;
  onChange: () => void;
  onDelete: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      onToggle();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onToggle();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onToggle]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="소속 대학 관리"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-muted hover:text-text-primary"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <circle cx="8" cy="3" r="1.4" />
          <circle cx="8" cy="8" r="1.4" />
          <circle cx="8" cy="13" r="1.4" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-line-normal bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={onChange}
            className="flex w-full px-3 py-2 text-left text-[13px] text-text-primary hover:bg-muted"
          >
            {changeLabel}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onDelete}
            className="flex w-full px-3 py-2 text-left text-[13px] text-danger-800 hover:bg-muted"
          >
            {deleteLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
