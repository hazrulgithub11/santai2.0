import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Bell, CalendarClock, ShieldAlert, Zap } from "lucide-react";
import { AdminTopNav } from "@/components/AdminTopNav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StationControl = {
  id: number;
  name: string;
  isActive: boolean;
  remainingMinutes: number;
};

type AuditItem = {
  id: string;
  message: string;
  at: string;
};

const INITIAL_STATIONS: StationControl[] = [
  { id: 1, name: "PS1", isActive: true, remainingMinutes: 32 },
  { id: 2, name: "PS2", isActive: false, remainingMinutes: 0 },
  { id: 3, name: "PS3", isActive: true, remainingMinutes: 18 },
  { id: 4, name: "PS4", isActive: false, remainingMinutes: 0 },
  { id: 5, name: "PS5", isActive: true, remainingMinutes: 41 },
  { id: 6, name: "VR", isActive: true, remainingMinutes: 26 },
  { id: 7, name: "VR", isActive: false, remainingMinutes: 0 },
];

const QUEUE_ITEMS: ReadonlyArray<{ time: string; station: string; action: string }> = [
  { time: "14:45", station: "PS2", action: "Start 60 min session" },
  { time: "15:00", station: "PS4", action: "Start 30 min session" },
  { time: "15:15", station: "VR (S6)", action: "Start 45 min session" },
  { time: "15:30", station: "PS1", action: "Extend +15 min" },
];

const ALERTS: ReadonlyArray<{ id: string; severity: "warn" | "info"; text: string }> = [
  { id: "timer-expired-s3", severity: "warn", text: "PS3 timer expired 2 min ago." },
  { id: "station4-heartbeat", severity: "warn", text: "PS4 no data heartbeat for 5 min." },
  { id: "queue-overlap", severity: "info", text: "Queue overlap risk around 15:00-15:15." },
];

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AdminOperationsPage() {
  const [stations, setStations] = useState<StationControl[]>(INITIAL_STATIONS);
  const [auditLog, setAuditLog] = useState<AuditItem[]>([
    {
      id: "seed-1",
      message: "Admin A turned PS1 ON manually.",
      at: "14:21",
    },
    {
      id: "seed-2",
      message: "Admin B started PS5 timer for 45 min.",
      at: "14:28",
    },
  ]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null);

  const activeCount = useMemo(() => {
    let total = 0;
    for (const station of stations) {
      if (station.isActive) {
        total += 1;
      }
    }
    return total;
  }, [stations]);

  const appendAudit = (message: string) => {
    const entry: AuditItem = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      at: nowLabel(),
    };
    setAuditLog((current) => [entry, ...current].slice(0, 12));
  };

  const openConfirm = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const runGlobalAction = (action: "on" | "off" | "extend" | "stop") => {
    if (action === "on") {
      setStations((current) =>
        current.map((station) => ({ ...station, isActive: true })),
      );
      appendAudit("Admin triggered global action: Turn All ON.");
      return;
    }

    if (action === "extend") {
      setStations((current) =>
        current.map((station) => {
          if (!station.isActive) {
            return station;
          }
          return {
            ...station,
            remainingMinutes: station.remainingMinutes + 15,
          };
        }),
      );
      appendAudit("Admin triggered global action: Extend all timers +15 min.");
      return;
    }

    if (action === "off") {
      openConfirm(
        "Turn All OFF",
        "This will stop all active stations immediately. Continue?",
        () => {
          setStations((current) =>
            current.map((station) => ({
              ...station,
              isActive: false,
              remainingMinutes: 0,
            })),
          );
          appendAudit("Admin triggered global action: Turn All OFF.");
        },
      );
      return;
    }

    openConfirm(
      "Emergency Stop",
      "Emergency stop is destructive and ends every active session now.",
      () => {
        setStations((current) =>
          current.map((station) => ({
            ...station,
            isActive: false,
            remainingMinutes: 0,
          })),
        );
        appendAudit("Admin triggered global action: Emergency stop.");
      },
    );
  };

  const runStationAction = (stationId: number, action: "extend" | "stop") => {
    const station = stations.find((item) => item.id === stationId);
    if (!station) {
      return;
    }
    if (action === "extend") {
      setStations((current) =>
        current.map((item) => {
          if (item.id !== stationId || !item.isActive) {
            return item;
          }
          return { ...item, remainingMinutes: item.remainingMinutes + 15 };
        }),
      );
      appendAudit(`Admin extended ${station.name} (S${station.id}) by 15 min.`);
      return;
    }

    openConfirm(
      `Force stop ${station.name}`,
      "This action ends the station session immediately. Continue?",
      () => {
        setStations((current) =>
          current.map((item) => {
            if (item.id !== stationId) {
              return item;
            }
            return { ...item, isActive: false, remainingMinutes: 0 };
          }),
        );
        appendAudit(`Admin force-stopped ${station.name} (S${station.id}).`);
      },
    );
  };

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
          Operations
        </h1>
        <p className="text-sm text-white/70">
          Quick actions, scheduler queue, audit trail, and alerts in one place.
        </p>
      </div>

      <section className="liquid-glass rounded-2xl p-5 text-white">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <h2 className="font-heading text-lg font-semibold">Quick Actions Panel</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="bg-emerald-500 text-black hover:bg-emerald-400" onClick={() => runGlobalAction("on")}>
            Turn All ON
          </Button>
          <Button className="bg-rose-500 text-white hover:bg-rose-400" onClick={() => runGlobalAction("off")}>
            Turn All OFF
          </Button>
          <Button className="border-white/20 bg-white/5 text-white hover:bg-white/15" variant="outline" onClick={() => runGlobalAction("extend")}>
            Extend all +15m
          </Button>
          <Button className="bg-red-600 text-white hover:bg-red-500" onClick={() => runGlobalAction("stop")}>
            Emergency stop
          </Button>
        </div>
        <p className="mt-3 text-xs text-white/60">Active stations now: {activeCount}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="liquid-glass rounded-2xl p-5 text-white">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            <h2 className="font-heading text-lg font-semibold">Scheduler Queue</h2>
          </div>
          <ul className="space-y-2">
            {QUEUE_ITEMS.map((item) => (
              <li
                key={`${item.time}-${item.station}`}
                className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm"
              >
                <span className="text-white/80">{item.time}</span>
                <span>{item.station}</span>
                <span className="text-white/70">{item.action}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="liquid-glass rounded-2xl p-5 text-white">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <h2 className="font-heading text-lg font-semibold">Per-Station Actions</h2>
          </div>
          <ul className="space-y-2">
            {stations.map((station) => (
              <li
                key={station.id}
                className="rounded-lg border border-white/10 px-3 py-3"
              >
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {station.name} (S{station.id})
                  </span>
                  <span className={station.isActive ? "text-emerald-200" : "text-white/60"}>
                    {station.isActive ? `${station.remainingMinutes} min left` : "Inactive"}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    className="border-white/20 bg-white/5 text-white hover:bg-white/15"
                    disabled={!station.isActive}
                    onClick={() => runStationAction(station.id, "extend")}
                  >
                    +15 min
                  </Button>
                  <Button
                    className="bg-rose-500 text-white hover:bg-rose-400"
                    disabled={!station.isActive}
                    onClick={() => runStationAction(station.id, "stop")}
                  >
                    Force stop
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="liquid-glass rounded-2xl p-5 text-white">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <h2 className="font-heading text-lg font-semibold">Alerts & Notifications</h2>
          </div>
          <ul className="space-y-2">
            {ALERTS.map((alert) => (
              <li
                key={alert.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  alert.severity === "warn"
                    ? "border-amber-300/30 bg-amber-500/10 text-amber-100"
                    : "border-cyan-300/30 bg-cyan-500/10 text-cyan-100"
                }`}
              >
                {alert.text}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/55">
            Next step: wire these alerts to Telegram/Slack/email hooks.
          </p>
        </article>

        <article className="liquid-glass rounded-2xl p-5 text-white">
          <h2 className="font-heading text-lg font-semibold">Audit Log</h2>
          <ul className="mt-4 space-y-2">
            {auditLog.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm"
              >
                <p>{item.message}</p>
                <p className="mt-1 text-xs text-white/55">{item.at}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="gap-5 border-white/20 bg-neutral-950/95 text-white">
          <DialogHeader>
            <DialogTitle>{confirmTitle}</DialogTitle>
            <DialogDescription className="text-white/70">
              {confirmMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/15"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-rose-500 text-white hover:bg-rose-400"
              onClick={() => {
                if (confirmAction) {
                  confirmAction();
                }
                setConfirmOpen(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
