"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { INSTITUTION_CATALOG, institutionLogoSrc } from "@/lib/institution/catalog";
import { isMockVerifiedStudentId } from "@/lib/institution/verify";
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
  mode?: "modal" | "settings";
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
  const [open, setOpen] = useState(mode === "settings");
  const [step, setStep] = useState<"ask" | "select" | "verify">(mode === "settings" ? "select" : "ask");
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (mode === "settings") {
      const prefs = loadPreferences();
      setSelectedId(prefs.universityVerified ? prefs.universityId : null);
      setVerified(prefs.universityVerified === true);
      setOpen(true);
      return;
    }
    const prefs = loadPreferences();
    if (!prefs.universityAsked) setOpen(true);
  }, [mode]);

  useEffect(() => {
    const sync = () => {
      const prefs = loadPreferences();
      if (mode === "settings") {
        setSelectedId(prefs.universityVerified ? prefs.universityId : null);
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

  const persist = (next: {
    universityId: string | null;
    universityName: string | null;
    universityAsked: boolean;
    universityVerified: boolean;
  }) => {
    const prefs = loadPreferences();
    savePreferences({ ...prefs, ...next });
  };

  const finishNone = () => {
    persist({ universityId: null, universityName: null, universityAsked: true, universityVerified: false });
    void fetch("/api/me/affiliation", { method: "DELETE" });
    if (mode === "modal") setOpen(false);
    setSelectedId(null);
    setVerified(false);
    setStudentId("");
    setVerifyError(null);
    setStep(mode === "settings" ? "select" : "ask");
  };

  const pickUniversity = (row: InstitutionOption) => {
    setSelectedId(row.id);
    setStudentId("");
    setVerifyError(null);
    setVerified(false);
    setStep("verify");
  };

  const submitStudentId = () => {
    const row = selectedRow;
    if (!row) return;
    if (isMockVerifiedStudentId(studentId, row.id)) {
      persist({
        universityId: row.id,
        universityName: row.nameKo,
        universityAsked: true,
        universityVerified: true,
      });
      void fetch("/api/me/affiliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: row.id }),
      });
      setVerified(true);
      setVerifyError(null);
      if (mode === "modal") setOpen(false);
      return;
    }
    persist({ universityId: null, universityName: null, universityAsked: true, universityVerified: false });
    void fetch("/api/me/affiliation", { method: "DELETE" });
    setVerified(false);
    setVerifyError(t("affiliation.verifyFail"));
  };

  if (!open) return null;

  const body = (
    <div className={mode === "modal" ? "rounded-2xl bg-white p-5 shadow-xl w-full max-w-md" : ""}>
          <p className="text-[16px] font-bold text-text-primary">
            {t(mode === "settings" ? "affiliation.settingsTitle" : "affiliation.title")}
          </p>

      {step === "ask" && mode === "modal" ? (
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
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            {selectedRow ? (
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
                  <p className="py-6 text-center text-[13px] text-text-tertiary">검색 결과가 없어요.</p>
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
          </div>

          {step === "verify" && selectedRow && !verified && (
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-text-primary">{t("affiliation.studentId")}</p>
              <input
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setVerifyError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitStudentId();
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
                disabled={!studentId.trim()}
                onClick={submitStudentId}
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
          )}

          {verified && selectedRow && (
            <p className="text-[12px] font-semibold text-accent-700">{t("affiliation.verifyOk")}</p>
          )}

          {mode === "settings" && (
            <button type="button" onClick={finishNone} className="text-[12px] text-text-tertiary">
              {t("affiliation.clear")}
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (mode === "settings") return body;

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/40 p-4">
      {body}
    </div>
  );
}
