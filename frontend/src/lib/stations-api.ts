export type ActiveSession = {
  id: number;
  stationId: number;
  startTime: string;
  endTime: string;
  isFinished: boolean;
};

export type StationRow = {
  id: number;
  name: string;
  isActive: boolean;
  activeSession: ActiveSession | null;
};

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function readErrorMessage(data: unknown, fallback: string): string {
  if (!isRecord(data)) {
    return fallback;
  }
  const err = data.error;
  if (isRecord(err) && typeof err.message === "string") {
    return err.message;
  }
  return fallback;
}

export function parseStationsPayload(data: unknown): StationRow[] | null {
  if (!isRecord(data) || data.ok !== true) {
    return null;
  }
  const raw = data.stations;
  if (!Array.isArray(raw)) {
    return null;
  }
  const out: StationRow[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const id = item.id;
    const name = item.name;
    const isActive = item.isActive;
    if (
      typeof id !== "number" ||
      typeof name !== "string" ||
      typeof isActive !== "boolean"
    ) {
      continue;
    }
    let activeSession: ActiveSession | null = null;
    const as = item.activeSession;
    if (as !== null && as !== undefined) {
      if (!isRecord(as)) {
        continue;
      }
      const sid = as.id;
      const stationId = as.stationId;
      const startTime = as.startTime;
      const endTime = as.endTime;
      const isFinished = as.isFinished;
      if (
        typeof sid === "number" &&
        typeof stationId === "number" &&
        typeof startTime === "string" &&
        typeof endTime === "string" &&
        typeof isFinished === "boolean"
      ) {
        activeSession = {
          id: sid,
          stationId,
          startTime,
          endTime,
          isFinished,
        };
      }
    } else {
      activeSession = null;
    }
    out.push({ id, name, isActive, activeSession });
  }
  return out;
}
