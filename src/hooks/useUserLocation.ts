"use client";

import { useCallback, useEffect, useState } from "react";

export type UserLocationStatus = "idle" | "prompting" | "granted" | "denied" | "unavailable";

export interface UserCoords {
  lat: number;
  lng: number;
}

interface Options {
  enabled?: boolean;
}

export function useUserLocation({ enabled = true }: Options = {}) {
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [status, setStatus] = useState<UserLocationStatus>("idle");

  const request = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }

    setStatus("prompting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setStatus("granted");
      },
      (err) => {
        setCoords(null);
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    if (!enabled) return;
    request();
  }, [enabled, request]);

  return { coords, status, request };
}
