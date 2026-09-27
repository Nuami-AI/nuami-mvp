"use client";

import { useEffect, useState } from "react";

import { clearActiveUserEmail, setActiveUserEmail } from "@/lib/user/storage-scope";
import { applyServerAffiliation } from "@/lib/user/preferences";

/** Bind localStorage to the signed-in email before the app reads prefs/history. */
export function SyncStorageScope({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = (await sessionRes.json()) as {
          authenticated?: boolean;
          email?: string | null;
        };
        if (cancelled) return;

        if (session.authenticated && session.email) {
          setActiveUserEmail(session.email);
          // Server affiliation is source of truth — clears stale campus/credit UI after demo reset.
          const affRes = await fetch("/api/me/affiliation");
          if (affRes.ok) {
            const aff = (await affRes.json()) as {
              organizationId?: string | null;
              organizationName?: string | null;
            };
            if (!cancelled) {
              applyServerAffiliation({
                organizationId: aff.organizationId ?? null,
                organizationName: aff.organizationName ?? null,
              });
            }
          } else if (!cancelled) {
            applyServerAffiliation({ organizationId: null, organizationName: null });
          }
        } else {
          clearActiveUserEmail();
        }
      } catch {
        if (!cancelled) clearActiveUserEmail();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <div className="min-h-dvh bg-background" aria-busy="true" />;
  }

  return <>{children}</>;
}
