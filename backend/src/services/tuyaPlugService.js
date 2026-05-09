import TuyaDevice from "tuyapi";

/**
 * @param {unknown} raw
 * @returns {boolean | null}
 */
function normalizeOn(raw) {
  if (raw === undefined || raw === null) {
    return null;
  }
  if (typeof raw === "boolean") {
    return raw;
  }
  if (typeof raw === "number") {
    return raw !== 0;
  }
  if (typeof raw === "string") {
    const s = raw.toLowerCase();
    if (s === "true" || s === "on" || s === "1") {
      return true;
    }
    if (s === "false" || s === "off" || s === "0") {
      return false;
    }
  }
  return null;
}

/**
 * @param {unknown} data
 * @returns {Record<string, unknown>}
 */
function extractDps(data) {
  if (data && typeof data === "object" && "dps" in data) {
    const inner = /** @type {{ dps?: unknown }} */ (data).dps;
    if (inner && typeof inner === "object") {
      return /** @type {Record<string, unknown>} */ (inner);
    }
  }
  return {};
}

/**
 * UDP broadcast discovery: fills LAN IP and firmware protocol version. Required
 * because TuyAPI skips find() when both id and ip are set in the constructor,
 * so a wrong TUYA_PROTOCOL_VERSION in .env is never auto-corrected.
 *
 * @param {{ deviceId: string, localKey: string, protocolVersion: string }} config
 * @returns {Promise<{ deviceIp: string, protocolVersion: string, gatewayId: string } | null>}
 */
async function discoverLanSnapshot(config) {
  const probe = new TuyaDevice({
    id: config.deviceId,
    key: config.localKey,
    version: config.protocolVersion,
    issueGetOnConnect: false,
  });

  // Same guard as withDevice: prevent an unhandled 'error' event from crashing
  // the process if the UDP probe encounters a socket-level failure.
  probe.on("error", (err) => {
    console.warn(
      "[tuya-plug] discovery probe error:",
      err instanceof Error ? err.message : err,
    );
  });

  try {
    await probe.find({ timeout: 8 });
    const ip = probe.device.ip;
    if (!ip || typeof ip !== "string") {
      return null;
    }
    return {
      deviceIp: ip,
      protocolVersion: String(probe.device.version),
      gatewayId:
        typeof probe.device.gwID === "string" && probe.device.gwID
          ? probe.device.gwID
          : config.deviceId,
    };
  } finally {
    try {
      probe.disconnect();
    } catch {
      // ignore
    }
  }
}

/** @type {{ cfg: Record<string, unknown> | null, expiresAt: number }} */
let resolvedLanCache = { cfg: null, expiresAt: 0 };

/** Skip UDP find() until this time (ms) after a failed discovery (avoids 8s stall on every request). */
let discoveryBackoffUntil = 0;

/**
 * @param {{ deviceId: string, localKey: string, deviceIp: string, devicePort: number, protocolVersion: string, powerDp: number, udpDiscover: boolean }} config
 */
async function resolvePlugLanConfig(config) {
  const now = Date.now();
  if (resolvedLanCache.cfg && resolvedLanCache.expiresAt > now) {
    return /** @type {typeof config & { gatewayId?: string }} */ (
      resolvedLanCache.cfg
    );
  }
  if (!config.udpDiscover) {
    return config;
  }
  if (now < discoveryBackoffUntil) {
    return config;
  }
  let snap = null;
  try {
    snap = await discoverLanSnapshot(config);
  } catch (err) {
    console.warn(
      "[tuya-plug] LAN discovery error:",
      err instanceof Error ? err.message : err,
    );
  }
  if (snap?.deviceIp) {
    const merged = {
      ...config,
      deviceIp: snap.deviceIp,
      protocolVersion: snap.protocolVersion,
      gatewayId: snap.gatewayId,
    };
    if (snap.deviceIp !== config.deviceIp) {
      console.warn(
        "[tuya-plug] discovery: using IP from UDP broadcast (differs from TUYA_DEVICE_IP)",
      );
    }
    if (snap.protocolVersion !== config.protocolVersion) {
      console.warn(
        `[tuya-plug] discovery: protocol ${snap.protocolVersion} (was ${config.protocolVersion} in env)`,
      );
    }
    resolvedLanCache = { cfg: merged, expiresAt: now + 45_000 };
    discoveryBackoffUntil = 0;
    return merged;
  }
  discoveryBackoffUntil = now + 120_000;
  return config;
}

/**
 * @param {{ deviceId: string, localKey: string, deviceIp: string, devicePort: number, protocolVersion: string, powerDp: number, udpDiscover: boolean, gatewayId?: string }} config
 */
function createDevice(config) {
  return new TuyaDevice({
    id: config.deviceId,
    key: config.localKey,
    ip: config.deviceIp,
    port: config.devicePort,
    gwID: config.gatewayId ?? config.deviceId,
    version: config.protocolVersion,
    issueGetOnConnect: false,
  });
}

/**
 * Runs `fn` with a short-lived device connection, then disconnects.
 * @template T
 * @param {{ deviceId: string, localKey: string, deviceIp: string, devicePort: number, protocolVersion: string, powerDp: number, udpDiscover: boolean, gatewayId?: string }} config
 * @param {(device: InstanceType<typeof TuyaDevice>) => Promise<T>} fn
 * @returns {Promise<T>}
 */
async function withDevice(config, fn) {
  const device = createDevice(config);

  // TuyaAPI emits an 'error' event on the device EventEmitter for socket-level
  // failures (e.g. EHOSTUNREACH when the device is offline or unreachable).
  // Node.js EventEmitter behaviour: if no 'error' listener is registered, it
  // re-throws the error as an uncaught exception and crashes the process.
  // We capture it into a rejected Promise and race it against fn(), so the
  // error surfaces as a normal Promise rejection rather than a process crash.
  const deviceError = new Promise((_resolve, reject) => {
    device.on("error", reject);
  });

  try {
    // If the device emits 'error' before fn() resolves, deviceError wins the
    // race and the whole call rejects with the socket error immediately.
    return await Promise.race([fn(device), deviceError]);
  } finally {
    try {
      device.disconnect();
    } catch {
      // ignore disconnect errors
    }
  }
}

const GET_STATUS_TIMEOUT_MS = 18_000;

/**
 * Reusable local-LAN Tuya plug helper (local key stays server-side only).
 * @param {{ deviceId: string, localKey: string, deviceIp: string, devicePort: number, protocolVersion: string, powerDp: number, udpDiscover: boolean }} config
 */
export function createTuyaPlugService(config) {
  return {
    /**
     * @returns {Promise<{ on: boolean | null, dps: Record<string, unknown> }>}
     */
    async getStatus() {
      const cfg = await resolvePlugLanConfig(config);
      console.log("[tuya-plug] getStatus: start", {
        deviceId: cfg.deviceId,
        ip: cfg.deviceIp,
        port: cfg.devicePort,
        protocol: cfg.protocolVersion,
        powerDp: cfg.powerDp,
        udpDiscover: cfg.udpDiscover,
      });
      const data = await Promise.race([
        withDevice(cfg, async (device) => {
          await device.connect();
          let payload = await device.get({ schema: true });
          let dps = extractDps(payload);
          if (Object.keys(dps).length === 0) {
            const refreshIds = [
              ...new Set([cfg.powerDp, 1, 2, 18, 19, 20, 4, 5, 6]),
            ].sort((a, b) => a - b);
            const refreshed = await device.refresh({
              requestedDPS: refreshIds,
            });
            dps =
              refreshed && typeof refreshed === "object"
                ? /** @type {Record<string, unknown>} */ (refreshed)
                : {};
          }
          return { __dps: dps };
        }),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `getStatus timed out after ${GET_STATUS_TIMEOUT_MS}ms (check protocol, key, IP, or set TUYA_UDP_DISCOVER=0 if discovery is blocked)`,
              ),
            );
          }, GET_STATUS_TIMEOUT_MS);
        }),
      ]);
      const dps =
        data && typeof data === "object" && "__dps" in data
          ? /** @type {{ __dps: Record<string, unknown> }} */ (data).__dps
          : {};
      const key = String(cfg.powerDp);
      const raw = dps[key] ?? dps[cfg.powerDp];
      const on = normalizeOn(raw);
      console.log("[tuya-plug] getStatus: success", {
        on,
        keys: Object.keys(dps),
      });
      return { on, dps };
    },

    /**
     * Turn relay on. Awaits the device ACK so a non-responsive plug surfaces
     * as a 502 error rather than a falsely-successful 200.
     *
     * @returns {Promise<{ on: boolean }>}
     */
    async setOn() {
      const cfg = await resolvePlugLanConfig(config);
      console.log("[tuya-plug] setOn: start", {
        deviceId: cfg.deviceId,
        ip: cfg.deviceIp,
        protocol: cfg.protocolVersion,
        powerDp: cfg.powerDp,
      });
      await withDevice(cfg, async (device) => {
        await device.connect();
        await device.set({
          dps: cfg.powerDp,
          set: true,
        });
      });
      console.log("[tuya-plug] setOn: ACK received");
      return { on: true };
    },

    /**
     * @returns {Promise<{ on: boolean }>}
     */
    async setOff() {
      const cfg = await resolvePlugLanConfig(config);
      console.log("[tuya-plug] setOff: start", {
        deviceId: cfg.deviceId,
        ip: cfg.deviceIp,
        protocol: cfg.protocolVersion,
        powerDp: cfg.powerDp,
      });
      await withDevice(cfg, async (device) => {
        await device.connect();
        await device.set({
          dps: cfg.powerDp,
          set: false,
        });
      });
      console.log("[tuya-plug] setOff: ACK received");
      return { on: false };
    },
  };
}
