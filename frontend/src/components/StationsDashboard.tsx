import { Monitor, Radio, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  // padStart keeps single-digit minutes/seconds aligned (e.g. 09:03) without manual if/else branches.
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
    <div className="mt-4 rounded-2xl bg-white/10 px-3 py-2 text-center ring-1 ring-white/10">
      <p className="text-[0.65rem] font-medium uppercase tracking-wide text-white/50">
        Time remaining
      </p>
      <p
        className="font-heading mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white"
        aria-live="polite"
      >
        {label}
      </p>
    </div>
  );
}

export function StationsDashboard() {
  const base = getApiBaseUrl();
  const navigate = useNavigate();
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
    <div className="w-full space-y-8">
      {/* Hero-style panel — matches landing `liquid-glass` section headers */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Monitor className="h-5 w-5 text-white" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-medium tracking-tight text-white sm:text-3xl">
                TVs & stations
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
                Live availability and session countdown from the server end time.
              </p>
              <button
                type="button"
                onClick={() => navigate("/app/view-live")}
                className="liquid-glass mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Radio className="h-4 w-4" aria-hidden />
                View live
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || !base}
            className="liquid-glass-strong inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden
            />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <section
        id="live-stations-grid"
        className="scroll-mt-28 space-y-8"
        aria-label="Live station data"
      >
      {error ? (
        <div
          className="rounded-2xl border border-red-400/35 bg-red-950/45 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {loading && stations === null && !error ? (
        <p className="text-center text-sm text-white/55">Loading stations…</p>
      ) : null}

      {stations !== null && stations.length === 0 ? (
        <p className="text-center text-sm text-white/55">
          No stations configured yet.
        </p>
      ) : null}

      {stations !== null && stations.length > 0 ? (
        <ul
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Live station availability"
        >
          {stations.map((station) => (
            <li key={station.id}>
              <article className="liquid-glass flex h-full flex-col rounded-3xl p-5 text-white shadow-sm ring-1 ring-white/[0.06]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-heading truncate text-lg font-semibold tracking-tight">
                      {station.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-white/50">
                      Station #{station.id}
                    </p>
                  </div>
                  {station.isActive ? (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-200 ring-1 ring-red-400/30">
                      In Use
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/25">
                      Available
                    </span>
                  )}
                </div>

                {station.isActive && station.activeSession ? (
                  <SessionCountdown endTimeIso={station.activeSession.endTime} />
                ) : station.isActive && !station.activeSession ? (
                  <p className="mt-4 text-xs leading-relaxed text-white/55">
                    In use — session end time is not available yet.
                  </p>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      ) : null}
      </section>
    </div>
  );
}
