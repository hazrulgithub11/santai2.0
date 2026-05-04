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

  const [stations, setStations] = useState<StationRow[] | null>(null);
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
      setStations(null);
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch(stationsUrl, { method: "GET" });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(readErrorMessage(data, `Request failed (${res.status})`));
        setStations(null);
        return;
      }
      const parsed = parseStationsPayload(data);
      if (!parsed) {
        setListError("Unexpected response from server.");
        setStations(null);
        return;
      }
      setStations(parsed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setListError(msg);
      setStations(null);
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

  const applyPreset = (minutes: number) => {
    setMinutesDraft(String(minutes));
    setSubmitError(null);
  };

  const handleConfirmStart = async () => {
    if (!startSessionUrl || !selectedStation) {
      return;
    }
    if (parsedMinutes === null) {
      setSubmitError("Enter a whole number of minutes (at least 1).");
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
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Admin — start sessions
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose an available station, set the timer, and start the session.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadStations()}
          disabled={listLoading || !base}
        >
          {listLoading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {listError ? (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {listError}
        </div>
      ) : null}

      {listLoading && stations === null && !listError ? (
        <p className="text-muted-foreground text-sm">Loading stations…</p>
      ) : null}

      {stations !== null && stations.length === 0 ? (
        <p className="text-muted-foreground text-sm">No stations configured yet.</p>
      ) : null}

      {stations !== null && stations.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map((station) => {
            const busy = station.isActive;
            return (
              <li key={station.id}>
                <article
                  className={cn(
                    "flex h-full flex-col rounded-xl border p-5 shadow-sm transition-colors",
                    busy
                      ? "cursor-not-allowed border-red-500/35 bg-red-500/[0.06] text-muted-foreground ring-1 ring-red-500/20 dark:border-red-400/30 dark:bg-red-950/25 dark:ring-red-400/15"
                      : "border-border bg-card text-card-foreground hover:border-primary/25 hover:bg-muted/30",
                  )}
                  aria-disabled={busy}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        className={cn(
                          "font-heading truncate text-lg font-semibold tracking-tight",
                          busy && "text-foreground/80",
                        )}
                      >
                        {station.name}
                      </h3>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Station #{station.id}
                      </p>
                    </div>
                    {busy ? (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-red-600/15 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-600/25 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30">
                        In use
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/25">
                        Available
                      </span>
                    )}
                  </div>

                  <p className="text-muted-foreground mt-3 text-xs">
                    {busy
                      ? "This station has an active session. End it before starting a new one here."
                      : "Open the timer picker to start a billed session."}
                  </p>

                  <div className="mt-4 flex flex-1 flex-col justify-end">
                    {busy ? (
                      <Button type="button" variant="secondary" size="sm" disabled>
                        Unavailable
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
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
        <DialogContent className="gap-6">
          <DialogHeader>
            <DialogTitle>
              {selectedStation
                ? `Start session — ${selectedStation.name}`
                : "Start session"}
            </DialogTitle>
            <DialogDescription>
              Pick a preset or enter minutes. The station will be marked in use
              immediately after confirmation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                Quick select
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_DURATION_PRESETS.map((p) => (
                  <Button
                    key={p.minutes}
                    type="button"
                    variant="outline"
                    size="sm"
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
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {submitError ? (
              <p
                className="text-destructive text-sm"
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
              onClick={closeDialog}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
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
