// web/src/hooks/useLocationMap.ts

import { useState, useEffect, useCallback } from "react";
import {
  getLiveLocations,
  type LiveLocationRow,
  type LocationMapSummary,
} from "../lib/locationMapService";
import { useAuthStore } from "../stores/authStore";
import { hasValidSession } from "../lib/sessionGuard";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function useLocationMap() {
  const tenantId = useAuthStore((s) => s.tenant?.id);

  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState<LiveLocationRow[]>([]);
  const [summary, setSummary] = useState<LocationMapSummary>({
    onTime: 0,
    absent: 0,
    late: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (d: string) => {
      if (!tenantId) return;
      const valid = await hasValidSession();
      if (!valid) return;
      setIsLoading(true);
      setError(null);
      const { data, summary, error } = await getLiveLocations(tenantId, d);
      if (error) setError(error);
      else {
        setRows(data);
        setSummary(summary);
      }
      setIsLoading(false);
    },
    [tenantId],
  );

  useEffect(() => {
    load(date);
  }, [date, load]);

  // Auto-refresh setiap 60 detik
  useEffect(() => {
    const interval = setInterval(() => load(date), 60_000);
    return () => clearInterval(interval);
  }, [date, load]);

  return {
    date,
    setDate,
    rows,
    summary,
    isLoading,
    error,
    refetch: () => load(date),
  };
}
