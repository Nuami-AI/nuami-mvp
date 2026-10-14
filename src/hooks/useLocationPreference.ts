"use client";

import { useEffect, useState } from "react";
import { loadPreferences, savePreferences } from "@/lib/user/preferences";

export function useLocationPreference() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const sync = () => setEnabled(loadPreferences().locationEnabled !== false);
    sync();
    window.addEventListener("nuami-prefs", sync);
    return () => window.removeEventListener("nuami-prefs", sync);
  }, []);

  const setLocationEnabled = (next: boolean) => {
    savePreferences({ ...loadPreferences(), locationEnabled: next });
    setEnabled(next);
  };

  return { enabled, setLocationEnabled };
}
