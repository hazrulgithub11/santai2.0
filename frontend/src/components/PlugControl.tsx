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
    <div className="liquid-glass flex w-full flex-col gap-4 rounded-2xl p-6 text-white">
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight text-white">
          Tuya plug (local)
        </h2>
        <p className="mt-1 text-xs text-white/65">
          Commands go to your backend; the device key never leaves the server.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm">
        <span className="text-white/70">Status: </span>
        <span className="font-medium">{statusLabel}</span>
        {lastDps && Object.keys(lastDps).length > 0 ? (
          <p className="mt-1 break-all font-mono text-[0.65rem] leading-relaxed text-white/60">
            DPS snapshot: {JSON.stringify(lastDps)}
          </p>
        ) : null}
      </div>

      {error ? (
        <p
          className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          className="bg-emerald-500 text-black hover:bg-emerald-400"
          disabled={loading || !base}
          onClick={() => void run("/api/plug/on", "POST")}
        >
          ON
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="bg-rose-500 text-white hover:bg-rose-400"
          disabled={loading || !base}
          onClick={() => void run("/api/plug/off", "POST")}
        >
          OFF
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/25 bg-white/5 text-white hover:bg-white/15"
          disabled={loading || !base}
          onClick={() => void run("/api/plug/status", "GET")}
        >
          Check status
        </Button>
      </div>

      {loading ? <p className="text-xs text-white/60">Loading…</p> : null}

      {!base ? (
        <p className="text-xs text-white/60">
          API base URL is not set. Add{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-white">
            VITE_API_BASE_URL
          </code>{" "}
          to <code className="rounded bg-white/10 px-1 py-0.5 text-white">.env</code>.
        </p>
      ) : (
        <p className="text-xs text-white/60">
          API: <code className="text-white">{base}</code>
        </p>
      )}
    </div>
  );
}
