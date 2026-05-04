import { useCallback, useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  parseStationsPayload,
  readErrorMessage,
  type ActiveSession,
  type StationRow,
} from "@/lib/stations-api";

export type { ActiveSession, StationRow };

function formatRemainingMmSs(remainingMs: number): string {
  const clamped = Math.max(0, remainingMs);
  const totalSec = Math.floor(clamped / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function SessionCountdown({ endTimeIso }: { endTimeIso: string }) {
  const [label, setLabel] = useState<string>(() => {
    const end = new Date(endTimeIso).getTime();
    const remaining = end - Date.now();
    return remaining <= 0 ? "Time Up!" : formatRemainingMmSs(remaining);
  });

  useEffect(() => {
    const tick = () => {
      const end = new Date(endTimeIso).getTime();
      const remaining = end - Date.now();
      if (remaining <= 0) {
        setLabel("Time Up!");
        return;
      }
      setLabel(formatRemainingMmSs(remaining));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endTimeIso]);

  return (
    <div className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-center">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Time remaining
      </p>
      <p
        className="font-heading mt-1 text-2xl font-semibold tabular-nums tracking-tight"
        aria-live="polite"
      >
        {label}
      </p>
    </div>
  );
}

export function StationsDashboard() {
  const base = getApiBaseUrl();
  const [stations, setStations] = useState<StationRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!base) {
      setError(
        "Set VITE_API_BASE_URL in frontend .env to your backend URL (e.g. http://localhost:3000).",
      );
      setStations(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${base}/api/stations`, { method: "GET" });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(readErrorMessage(data, `Request failed (${res.status})`));
        setStations(null);
        return;
      }
      const parsed = parseStationsPayload(data);
      if (!parsed) {
        setError("Unexpected response from server.");
        setStations(null);
        return;
      }
      setStations(parsed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setError(msg);
      setStations(null);
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            TVs & stations
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Live availability and session countdown from the server end time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || !base}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 shrink-0 items-center justify-center rounded-md px-4 text-sm font-medium shadow-sm transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error ? (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {loading && stations === null && !error ? (
        <p className="text-muted-foreground text-sm">Loading stations…</p>
      ) : null}

      {stations !== null && stations.length === 0 ? (
        <p className="text-muted-foreground text-sm">No stations configured yet.</p>
      ) : null}

      {stations !== null && stations.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map((station) => (
            <li key={station.id}>
              <article className="flex h-full flex-col rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-heading truncate text-lg font-semibold tracking-tight">
                      {station.name}
                    </h3>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Station #{station.id}
                    </p>
                  </div>
                  {station.isActive ? (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-red-600/15 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-600/25 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30">
                      In Use
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/25">
                      Available
                    </span>
                  )}
                </div>

                {station.isActive && station.activeSession ? (
                  <SessionCountdown endTimeIso={station.activeSession.endTime} />
                ) : station.isActive && !station.activeSession ? (
                  <p className="text-muted-foreground mt-4 text-xs">
                    In use, but no active session record — check admin data.
                  </p>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
