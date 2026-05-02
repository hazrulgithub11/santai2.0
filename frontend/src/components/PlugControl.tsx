import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api-base";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function readErrorMessage(data: unknown, fallback: string): string {
  if (!isRecord(data)) {
    return fallback;
  }
  const err = data.error;
  if (isRecord(err) && typeof err.message === "string") {
    return err.message;
  }
  return fallback;
}

export function PlugControl() {
  const base = getApiBaseUrl();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [on, setOn] = useState<boolean | null>(null);
  const [lastDps, setLastDps] = useState<Record<string, unknown> | null>(null);

  const run = useCallback(
    async (path: string, method: "GET" | "POST") => {
      if (!base) {
        setError(
          "Set VITE_API_BASE_URL in frontend .env (see .env.example) to your backend URL.",
        );
        return;
      }
      setLoading(true);
      setError(null);
      const url = `${base}${path}`;
      console.log("[plug-ui]", method, url);
      try {
        const res = await fetch(url, { method });
        const data: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(readErrorMessage(data, `Request failed (${res.status})`));
          return;
        }
        if (isRecord(data) && data.ok === true && "on" in data) {
          setOn(typeof data.on === "boolean" ? data.on : null);
          if (path.endsWith("/status") && "dps" in data && isRecord(data.dps)) {
            setLastDps(data.dps as Record<string, unknown>);
          } else if (!path.endsWith("/status")) {
            setLastDps(null);
          }
          return;
        }
        setError("Unexpected response from server.");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [base],
  );

  const statusLabel =
    on === null ? "Unknown" : on ? "ON" : "OFF";

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Tuya plug (local)
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Commands go to your backend; the device key never leaves the server.
        </p>
      </div>

      <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Status: </span>
        <span className="font-medium">{statusLabel}</span>
        {lastDps && Object.keys(lastDps).length > 0 ? (
          <p className="text-muted-foreground mt-1 font-mono text-[0.65rem] leading-relaxed break-all">
            DPS snapshot: {JSON.stringify(lastDps)}
          </p>
        ) : null}
      </div>

      {error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          disabled={loading || !base}
          onClick={() => void run("/api/plug/on", "POST")}
        >
          ON
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading || !base}
          onClick={() => void run("/api/plug/off", "POST")}
        >
          OFF
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || !base}
          onClick={() => void run("/api/plug/status", "GET")}
        >
          Check status
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-xs">Loading…</p>
      ) : null}

      {!base ? (
        <p className="text-muted-foreground text-xs">
          API base URL is not set. Add{" "}
          <code className="bg-muted rounded px-1 py-0.5">VITE_API_BASE_URL</code>{" "}
          to <code className="bg-muted rounded px-1 py-0.5">.env</code>.
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">
          API: <code className="text-foreground">{base}</code>
        </p>
      )}
    </div>
  );
}
