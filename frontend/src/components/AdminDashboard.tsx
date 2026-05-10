import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  isRecord,
  parseStationsPayload,
  readErrorMessage,
  type StationRow,
} from "@/lib/stations-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const QUICK_DURATION_PRESETS: ReadonlyArray<{ label: string; minutes: number }> =
  [
    { label: "15 Min", minutes: 15 },
    { label: "30 Min", minutes: 30 },
    { label: "1 Hour", minutes: 60 },
    { label: "2 Hours", minutes: 120 },
  ];
const TOTAL_STATIONS = 7;
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

function buildDummyStations(): StationRow[] {
  const out: StationRow[] = [];
  for (let stationId = 2; stationId <= TOTAL_STATIONS; stationId += 1) {
    out.push({
      id: stationId,
      name: getStationDisplayName(stationId),
      isActive: stationId % 2 === 0,
      activeSession: null,
    });
  }
  return out;
}

function parseStartSessionResponse(data: unknown): boolean {
  return isRecord(data) && data.ok === true;
}

export function AdminDashboard() {
  const base = getApiBaseUrl();
  const stationsUrl = useMemo(
    () => (base ? `${base}/api/stations` : ""),
    [base],
  );
  const startSessionUrl = useMemo(
    () => (base ? `${base}/api/admin/start-session` : ""),
    [base],
  );

  const [backendStations, setBackendStations] = useState<StationRow[] | null>(null);
  const [dummyStations, setDummyStations] = useState<StationRow[]>(() =>
    buildDummyStations(),
  );
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<StationRow | null>(
    null,
  );
  const [minutesDraft, setMinutesDraft] = useState<string>("30");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadStations = useCallback(async () => {
    if (!stationsUrl) {
      setListError(
        "Set VITE_API_BASE_URL in frontend .env to your backend URL (e.g. http://localhost:3000).",
      );
      setBackendStations(null);
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch(stationsUrl, { method: "GET" });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(readErrorMessage(data, `Request failed (${res.status})`));
        setBackendStations(null);
        return;
      }
      const parsed = parseStationsPayload(data);
      if (!parsed) {
        setListError("Unexpected response from server.");
        setBackendStations(null);
        return;
      }
      setBackendStations(parsed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setListError(msg);
      setBackendStations(null);
    } finally {
      setListLoading(false);
    }
  }, [stationsUrl]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadStations();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadStations]);

  const openTimerDialog = (station: StationRow) => {
    if (station.isActive) {
      return;
    }
    setSelectedStation(station);
    setMinutesDraft("30");
    setSubmitError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedStation(null);
    setSubmitError(null);
    setSubmitLoading(false);
  };

  const parsedMinutes = useMemo(() => {
    const n = Number.parseInt(minutesDraft.trim(), 10);
    if (!Number.isFinite(n) || n < 1) {
      return null;
    }
    return n;
  }, [minutesDraft]);

  const mergedStations = useMemo(() => {
    const byId = new Map<number, StationRow>();

    if (backendStations) {
      for (const station of backendStations) {
        byId.set(station.id, station);
      }
    }
    for (const station of dummyStations) {
      if (!byId.has(station.id)) {
        byId.set(station.id, station);
      }
    }
    if (!byId.has(1)) {
      byId.set(1, {
        id: 1,
        name: getStationDisplayName(1),
        isActive: false,
        activeSession: null,
      });
    }

    const ordered: StationRow[] = [];
    for (let stationId = 1; stationId <= TOTAL_STATIONS; stationId += 1) {
      const station = byId.get(stationId);
      if (station) {
        ordered.push({
          ...station,
          name: getStationDisplayName(station.id),
        });
      }
    }
    return ordered;
  }, [backendStations, dummyStations]);

  const applyPreset = (minutes: number) => {
    setMinutesDraft(String(minutes));
    setSubmitError(null);
  };

  const handleConfirmStart = async () => {
    if (!selectedStation) {
      return;
    }
    if (parsedMinutes === null) {
      setSubmitError("Enter a whole number of minutes (at least 1).");
      return;
    }
    if (selectedStation.id === 1) {
      if (!startSessionUrl) {
        setSubmitError("Backend URL is not configured.");
        return;
      }
      setSubmitLoading(true);
      setSubmitError(null);
      try {
        const res = await fetch(startSessionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stationId: selectedStation.id,
            minutes: parsedMinutes,
          }),
        });
        const data: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSubmitError(readErrorMessage(data, `Request failed (${res.status})`));
          return;
        }
        if (!parseStartSessionResponse(data)) {
          setSubmitError("Unexpected response from server.");
          return;
        }
        closeDialog();
        await loadStations();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error";
        setSubmitError(msg);
      } finally {
        setSubmitLoading(false);
      }
      return;
    }

    // For stations 2-7 we keep local simulated state so admin can test
    // full 7-station workflows before backend support is expanded.
    setDummyStations((current) => {
      const updated: StationRow[] = [];
      const now = Date.now();
      for (const station of current) {
        if (station.id !== selectedStation.id) {
          updated.push(station);
          continue;
        }
        updated.push({
          ...station,
          isActive: true,
          activeSession: {
            id: now + station.id,
            stationId: station.id,
            startTime: new Date(now).toISOString(),
            endTime: new Date(now + parsedMinutes * 60_000).toISOString(),
            isFinished: false,
          },
        });
      }
      return updated;
    });
    closeDialog();
  };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDummyStations((current) => {
        const now = Date.now();
        let didChange = false;
        const updated: StationRow[] = [];
        for (const station of current) {
          if (!station.activeSession) {
            updated.push(station);
            continue;
          }
          const endTimeMs = new Date(station.activeSession.endTime).getTime();
          if (endTimeMs > now) {
            updated.push(station);
            continue;
          }
          didChange = true;
          updated.push({
            ...station,
            isActive: false,
            activeSession: null,
          });
        }
        return didChange ? updated : current;
      });
    }, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight text-white">
            Admin — start sessions
          </h2>
          <p className="mt-1 text-sm text-white/65">
            Choose an available station, set the timer, and start the session.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 bg-white/5 text-white hover:bg-white/15"
          onClick={() => void loadStations()}
          disabled={listLoading || !base}
        >
          {listLoading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {listError ? (
        <div
          className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
          role="alert"
        >
          {listError}
        </div>
      ) : null}

      {listLoading && backendStations === null && !listError ? (
        <p className="text-sm text-white/60">Loading stations…</p>
      ) : null}

      {backendStations !== null && backendStations.length === 0 ? (
        <p className="text-sm text-white/60">No stations configured yet.</p>
      ) : null}

      {mergedStations.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mergedStations.map((station) => {
            const busy = station.isActive;
            const isSimulated = station.id !== 1;
            return (
              <li key={station.id}>
                <article
                  className={cn(
                    "liquid-glass flex h-full flex-col rounded-2xl border p-5 transition-colors",
                    busy
                      ? "cursor-not-allowed border-red-400/45 bg-red-500/[0.09] text-white/70 ring-1 ring-red-400/25"
                      : "border-white/10 text-white hover:border-white/25 hover:bg-white/10",
                  )}
                  aria-disabled={busy}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        className={cn(
                          "font-heading truncate text-lg font-semibold tracking-tight",
                          busy ? "text-white/80" : "text-white",
                        )}
                      >
                        {station.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-white/55">
                        Station #{station.id}
                      </p>
                      <p className="mt-1 text-[0.7rem] text-white/45">
                        {isSimulated ? "Simulated data" : "Live backend data"}
                      </p>
                    </div>
                    {busy ? (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-red-400/20 px-2.5 py-0.5 text-xs font-medium text-red-100 ring-1 ring-red-300/40">
                        In use
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-xs font-medium text-emerald-100 ring-1 ring-emerald-300/40">
                        Available
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-white/60">
                    {busy
                      ? "This station has an active session. End it before starting a new one here."
                      : isSimulated
                        ? "Simulated station for admin flow testing."
                        : "Open the timer picker to start a billed session."}
                  </p>

                  <div className="mt-4 flex flex-1 flex-col justify-end">
                    {busy ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="bg-white/15 text-white/80"
                        disabled
                      >
                        Unavailable
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="w-full bg-white text-black hover:bg-white/90"
                        onClick={() => openTimerDialog(station)}
                      >
                        Start timer
                      </Button>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          } else {
            setDialogOpen(true);
          }
        }}
      >
        <DialogContent className="gap-6 border-white/20 bg-neutral-950/95 text-white">
          <DialogHeader>
            <DialogTitle>
              {selectedStation
                ? `Start session — ${selectedStation.name}`
                : "Start session"}
            </DialogTitle>
            <DialogDescription className="text-white/65">
              Pick a preset or enter minutes. The station will be marked in use
              immediately after confirmation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide uppercase text-white/60">
                Quick select
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_DURATION_PRESETS.map((p) => (
                  <Button
                    key={p.minutes}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/5 text-white hover:bg-white/15"
                    disabled={submitLoading}
                    onClick={() => applyPreset(p.minutes)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="admin-session-minutes"
                className="text-sm font-medium leading-none"
              >
                Custom duration (minutes)
              </label>
              <input
                id="admin-session-minutes"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={minutesDraft}
                onChange={(e) => {
                  setMinutesDraft(e.target.value);
                  setSubmitError(null);
                }}
                disabled={submitLoading}
                className="flex h-9 w-full rounded-md border border-white/20 bg-white/5 px-3 py-1 text-sm text-white shadow-xs outline-none transition-[color,box-shadow] placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {submitError ? (
              <p
                className="text-sm text-rose-200"
                role="alert"
              >
                {submitError}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/15"
              onClick={closeDialog}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-white text-black hover:bg-white/90"
              onClick={() => void handleConfirmStart()}
              disabled={submitLoading || parsedMinutes === null}
            >
              {submitLoading ? "Starting…" : "Start session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
