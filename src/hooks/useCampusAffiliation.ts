"use client";

import { useEffect, useState } from "react";

import { loadPreferences } from "@/lib/user/preferences";
import { campusPath, getInstitution } from "@/lib/institution/catalog";

export function shortUniversityName(nameKo: string): string {
  return nameKo.replace(/대학교$/, "대").replace(/대학$/, "대");
}

export function useCampusAffiliation(): {
  ready: boolean;
  universityId: string | null;
  universityName: string | null;
  navLabel: string | null;
  campusHref: string;
} {
  const [ready, setReady] = useState(false);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const prefs = loadPreferences();
      const verified = prefs.universityVerified === true;
      setUniversityId(verified ? prefs.universityId : null);
      setUniversityName(verified ? prefs.universityName : null);
      setReady(true);
    };
    sync();
    window.addEventListener("nuami-prefs", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("nuami-prefs", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const mine = universityId ? getInstitution(universityId) : undefined;

  return {
    ready,
    universityId,
    universityName,
    navLabel: universityName ? shortUniversityName(universityName) : null,
    campusHref: mine ? campusPath(mine) : "/campus",
  };
}
