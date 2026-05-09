import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Activity, Clock3, BarChart3, Tv } from "lucide-react";
import { AdminTopNav } from "@/components/AdminTopNav";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  parseStationsPayload,
  readErrorMessage,
  type StationRow,
} from "@/lib/stations-api";

const STATION_DISPLAY_NAME: Record<number, string> = {
  1: "PS1",
  2: "PS2",
  3: "PS3",
  4: "PS4",
  5: "PS5",
  6: "VR",
  7: "VR",
};

function getStationDisplayName(stationId: number): string {
  return STATION_DISPLAY_NAME[stationId] ?? `Station ${stationId}`;
}

function buildFallbackStation(stationId: number): StationRow {
  return {
    id: stationId,
    name: getStationDisplayName(stationId),
    isActive: stationId % 2 === 0,
    activeSession: null,
  };
}

export function AdminAnalyticsPage() {
  const base = getApiBaseUrl();
  const [backendStations, setBackendStations] = useState<StationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!base) {
      setBackendStations(null);
      setError("Set VITE_API_BASE_URL to fetch Station 1 live data.");
      return;
    }

    let disposed = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${base}/api/stations`, { method: "GET" });
        const data: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!disposed) {
            setError(readErrorMessage(data, `Request failed (${res.status})`));
            setBackendStations(null);
          }
          return;
        }
        const parsed = parseStationsPayload(data);
        if (!parsed) {
          if (!disposed) {
            setError("Unexpected response from server.");
            setBackendStations(null);
          }
          return;
        }
        if (!disposed) {
          setBackendStations(parsed);
          setError(null);
        }
      } catch (err) {
        if (!disposed) {
          setBackendStations(null);
          setError(err instanceof Error ? err.message : "Network error");
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    void load();
    const intervalId = window.setInterval(() => void load(), 15000);
    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [base]);

  const mergedStations = useMemo(() => {
    const backendById = new Map<number, StationRow>();
    if (backendStations) {
      for (const station of backendStations) {
        backendById.set(station.id, station);
      }
    }

    const all: StationRow[] = [];
    for (let stationId = 1; stationId <= 7; stationId += 1) {
      const backendStation = backendById.get(stationId);
      if (backendStation) {
        all.push({
          ...backendStation,
          name: getStationDisplayName(backendStation.id),
        });
      } else {
        all.push(buildFallbackStation(stationId));
      }
    }
    return all;
  }, [backendStations]);

  let activeNow = 0;
  for (const station of mergedStations) {
    if (station.isActive) {
      activeNow += 1;
    }
  }
  const availableNow = mergedStations.length - activeNow;
  const utilizationPct =
    mergedStations.length > 0 ? Math.round((activeNow / mergedStations.length) * 100) : 0;

  const totalSessionsToday = activeNow * 4 + 9;
  const avgSessionMinutes = 52;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex w-full max-w-5xl flex-col gap-6"
    >
      <AdminTopNav />

      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-white">
          Analytics
        </h1>
        <p className="text-sm text-white/70">
          Station 1 uses live backend data. Stations 2-7 are simulated for now.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="liquid-glass rounded-2xl p-4 text-white">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/70">
            <Activity className="h-4 w-4" />
            Active now
          </div>
          <p className="text-2xl font-semibold">{activeNow}</p>
        </article>
        <article className="liquid-glass rounded-2xl p-4 text-white">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/70">
            <Tv className="h-4 w-4" />
            Available now
          </div>
          <p className="text-2xl font-semibold">{availableNow}</p>
        </article>
        <article className="liquid-glass rounded-2xl p-4 text-white">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/70">
            <BarChart3 className="h-4 w-4" />
            Sessions today
          </div>
          <p className="text-2xl font-semibold">{totalSessionsToday}</p>
        </article>
        <article className="liquid-glass rounded-2xl p-4 text-white">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/70">
            <Clock3 className="h-4 w-4" />
            Avg session
          </div>
          <p className="text-2xl font-semibold">{avgSessionMinutes} min</p>
        </article>
      </section>

      <section className="liquid-glass rounded-2xl p-5 text-white">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="font-heading text-lg font-semibold">Station utilization</h2>
          <span className="text-sm text-white/75">{utilizationPct}% active</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-emerald-300/90 transition-all"
            style={{ width: `${utilizationPct}%` }}
          />
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {mergedStations.map((station) => (
            <li
              key={station.id}
              className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm"
            >
              <span>{station.name}</span>
              <span
                className={
                  station.isActive ? "text-rose-200" : "text-emerald-200"
                }
              >
                {station.isActive ? "In use" : "Available"}
              </span>
            </li>
          ))}
        </ul>
        {loading ? <p className="mt-3 text-xs text-white/60">Refreshing data…</p> : null}
      </section>
    </motion.div>
  );
}
