import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** One station slot on the floor plan (percents match viewBox 0 0 320 280). */
type LiveStation = {
  id: string;
  label: string;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  available: boolean;
  /** When occupied, session ends at this time (ISO). Omitted when available. */
  busyUntil?: string;
};

/**
 * Dummy layout: L-shaped room — left column VR→PS4, top arm with SIM RACING center,
 * PS5/PS6 on the right of the arm (matches your blueprint).
 * Replace with API data later; keep the same shape for the map.
 */
function buildDummyStations(): LiveStation[] {
  const soon = (minutes: number) =>
    new Date(Date.now() + minutes * 60_000).toISOString();
  return [
    {
      id: "vr",
      label: "VR",
      xPct: 16,
      yPct: 84,
      wPct: 15,
      hPct: 8,
      available: true,
    },
    {
      id: "ps1",
      label: "PS1",
      xPct: 16,
      yPct: 69,
      wPct: 15,
      hPct: 8,
      available: false,
      busyUntil: soon(12),
    },
    {
      id: "ps2",
      label: "PS2",
      xPct: 16,
      yPct: 54,
      wPct: 15,
      hPct: 8,
      available: true,
    },
    {
      id: "ps3",
      label: "PS3",
      xPct: 16,
      yPct: 39,
      wPct: 15,
      hPct: 8,
      available: false,
      busyUntil: soon(45),
    },
    {
      id: "ps4",
      label: "PS4",
      xPct: 16,
      yPct: 24,
      wPct: 15,
      hPct: 8,
      available: true,
    },
    {
      id: "sim",
      label: "SIM RACING",
      xPct: 52,
      yPct: 20,
      wPct: 22,
      hPct: 9,
      available: false,
      busyUntil: soon(6),
    },
    {
      id: "ps5",
      label: "PS5",
      xPct: 82,
      yPct: 36,
      wPct: 15,
      hPct: 8,
      available: true,
    },
    {
      id: "ps6",
      label: "PS6",
      xPct: 82,
      yPct: 20,
      wPct: 15,
      hPct: 8,
      available: false,
      busyUntil: soon(28),
    },
  ];
}

/** Rounds remaining ms into mm:ss for the modal (simple loop would work; padStart is shorter). */
function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return "0:00";
  const totalSec = Math.ceil(remainingMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** L-shaped floor (single path, rounded outer corners). Coordinates in viewBox 0 0 320 280. */
const FLOOR_PATH_D =
  "M 32 260 L 32 32 Q 32 24 40 24 L 288 24 Q 296 24 296 32 L 296 124 Q 296 132 288 132 L 176 132 Q 168 132 168 140 L 168 260 Q 168 268 160 268 L 40 268 Q 32 268 32 260 Z";

export function ViewLivePage() {
  const stations = useMemo(() => buildDummyStations(), []);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const selected = selectedId
    ? stations.find((s) => s.id === selectedId) ?? null
    : null;

  useEffect(() => {
    if (!open || !selected || selected.available) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open, selected]);

  const remainingMs =
    selected && !selected.available && selected.busyUntil
      ? new Date(selected.busyUntil).getTime() - nowTick
      : 0;

  return (
    <div className="bloom-landing-secondary relative min-h-[75dvh] w-full overflow-hidden rounded-3xl">
      <div className="bloom-landing-secondary__ambient" aria-hidden />
      <div className="bloom-landing-secondary__frost" aria-hidden />

      <div className="relative z-[1] flex min-h-[75dvh] flex-col items-center justify-center gap-4 px-4 py-8">
        <p className="text-center text-sm text-white/80">
          Live floor map — tap a station for status
        </p>
        <div className="flex items-center gap-4 rounded-full border border-white/10 bg-black/20 px-4 py-1.5 text-xs text-white/85">
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]"
              aria-hidden
            />
            Available
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.9)]"
              aria-hidden
            />
            Not available
          </span>
        </div>

        {/* Top-down plan: no perspective or rotateX/Z — floor and stations stay parallel to the screen. */}
        <div className="flex w-full justify-center">
          <div
            className="relative w-full max-w-[640px]"
            style={{ aspectRatio: "320 / 280" }}
          >
            <svg
              className="absolute inset-0 h-full w-full drop-shadow-[0_20px_28px_rgba(0,0,0,0.45)]"
              viewBox="0 0 320 280"
              aria-hidden
            >
              <defs>
                <linearGradient
                  id="floorShade"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#7f8289" />
                  <stop offset="48%" stopColor="#696c73" />
                  <stop offset="100%" stopColor="#54575e" />
                </linearGradient>
                <linearGradient id="floorRim" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#28e1ff" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#56a6ff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#7a60ff" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path fill="url(#floorShade)" d={FLOOR_PATH_D} />
              <path
                d={FLOOR_PATH_D}
                fill="none"
                stroke="#0f1218"
                strokeWidth="10"
                strokeLinejoin="round"
              />
              <path
                d={FLOOR_PATH_D}
                fill="none"
                stroke="url(#floorRim)"
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeOpacity="0.9"
              />
            </svg>

            <div className="absolute inset-0">
              {stations.map((s) => (
                <div
                  key={s.id}
                  className="absolute"
                  style={{
                    left: `${s.xPct}%`,
                    top: `${s.yPct}%`,
                    width: `${s.wPct}%`,
                    height: `${s.hPct}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(s.id);
                      setOpen(true);
                    }}
                    className={`group relative h-full w-full cursor-pointer rounded-xl border bg-[#10131a] p-1.5 text-white transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none ${
                      s.available
                        ? "border-emerald-300/75 shadow-[0_0_0_1px_rgba(16,185,129,0.5),0_0_12px_rgba(16,185,129,0.65),0_8px_12px_rgba(0,0,0,0.45)]"
                        : "border-rose-300/75 shadow-[0_0_0_1px_rgba(244,63,94,0.5),0_0_12px_rgba(244,63,94,0.65),0_8px_12px_rgba(0,0,0,0.45)]"
                    }`}
                  >
                    {/* This inset frame creates the "pod" border glow like your reference image. */}
                    <div
                      className={`pointer-events-none absolute inset-[3px] rounded-lg border ${
                        s.available
                          ? "border-emerald-300/45 shadow-[inset_0_0_14px_rgba(16,185,129,0.28)]"
                          : "border-rose-300/45 shadow-[inset_0_0_14px_rgba(244,63,94,0.28)]"
                      }`}
                    />
                    <div className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-md bg-[#0a0d13] px-1 pb-1 pt-0.5">
                      <span className="text-[0.55rem] font-bold leading-none tracking-wide md:text-[0.62rem]">
                        {s.label}
                      </span>
                      <div className="h-[42%] w-[88%] rounded-[3px] border border-cyan-300/30 bg-linear-to-b from-[#0d2540] to-[#07101e] shadow-[0_0_8px_rgba(59,130,246,0.45)]" />
                      <div className="h-[24%] w-[33%] rounded-t-full bg-[#161b24] shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSelectedId(null);
        }}
      >
        <DialogContent className="gap-5 border-white/10 bg-neutral-950/95 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selected?.label ?? "Station"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {selected?.available
                ? "This station is free right now."
                : "This station is currently in use."}
            </DialogDescription>
          </DialogHeader>

          {selected && !selected.available && selected.busyUntil ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm text-white/60">Time left</p>
              <p className="font-mono text-2xl tabular-nums text-amber-300">
                {remainingMs > 0
                  ? formatCountdown(remainingMs)
                  : "Session ending…"}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setSelectedId(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
