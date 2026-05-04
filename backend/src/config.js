function parsePort(raw) {
  if (raw === undefined || raw === "") {
    return null;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    return null;
  }
  return n;
}

function parseCorsOrigins(raw) {
  if (raw === undefined || raw === "") {
    return [];
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const logLevels = ["fatal", "error", "warn", "info", "debug", "trace"];

function parseLogLevel(raw) {
  const v = (raw ?? "").toLowerCase();
  if (v && logLevels.includes(v)) {
    return v;
  }
  return "info";
}

export function loadConfig() {
  const port = parsePort(process.env.PORT);
  if (port === null) {
    throw new Error(
      "PORT is missing or invalid. Set PORT in .env (see .env.example).",
    );
  }

  const host = process.env.HOST?.trim();
  if (!host) {
    throw new Error(
      "HOST is missing. Set HOST in .env (see .env.example).",
    );
  }

  const nodeEnv = process.env.NODE_ENV?.trim() || "development";
  if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error(
      `NODE_ENV must be development, test, or production; got "${nodeEnv}".`,
    );
  }

  const trustProxyRaw = process.env.TRUST_PROXY?.trim().toLowerCase();
  const trustProxy =
    trustProxyRaw === "1" ||
    trustProxyRaw === "true" ||
    trustProxyRaw === "yes";

  return {
    nodeEnv,
    host,
    port,
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
    logLevel: parseLogLevel(process.env.LOG_LEVEL),
    trustProxy,
  };
}

function parseDevicePort(raw) {
  if (raw === undefined || raw === "") {
    return 6668;
  }
  const n = Number.parseInt(String(raw).trim(), 10);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    return null;
  }
  return n;
}

function parseUdpDiscover(raw) {
  if (raw === undefined || raw === "") {
    return true;
  }
  const v = String(raw).trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") {
    return false;
  }
  return true;
}

/**
 * Port, protocol, DP index, and discovery — shared by env-based and station-based plug config.
 * @returns {{ devicePort: number | null, protocolVersion: string, powerDp: number, udpDiscover: boolean }}
 */
function getTuyaLanTuning() {
  const devicePort = parseDevicePort(process.env.TUYA_DEVICE_PORT);
  const protocolVersion =
    process.env.TUYA_PROTOCOL_VERSION?.trim() || "3.4";
  const powerDpRaw = process.env.TUYA_POWER_DP?.trim() ?? "1";
  const powerDp = Number.parseInt(powerDpRaw, 10);
  const udpDiscover = parseUdpDiscover(process.env.TUYA_UDP_DISCOVER);
  return { devicePort, protocolVersion, powerDp, udpDiscover };
}

/**
 * Tuya local LAN plug settings (never sent to the frontend).
 * @returns {{ configured: false, message: string } | { configured: true, deviceId: string, localKey: string, deviceIp: string, devicePort: number, protocolVersion: string, powerDp: number, udpDiscover: boolean }}
 */
export function loadTuyaPlugConfig() {
  const deviceId = process.env.TUYA_DEVICE_ID?.trim();
  const localKey = process.env.TUYA_LOCAL_KEY?.trim();
  const deviceIp = process.env.TUYA_DEVICE_IP?.trim();
  const { devicePort, protocolVersion, powerDp, udpDiscover } =
    getTuyaLanTuning();

  if (!deviceId) {
    return { configured: false, message: "TUYA_DEVICE_ID is missing or empty." };
  }
  if (!localKey) {
    return { configured: false, message: "TUYA_LOCAL_KEY is missing or empty." };
  }
  if (localKey.length !== 16) {
    return {
      configured: false,
      message:
        "TUYA_LOCAL_KEY must be exactly 16 characters (TuyAPI / device encryption key).",
    };
  }
  if (!deviceIp) {
    return { configured: false, message: "TUYA_DEVICE_IP is missing or empty." };
  }
  if (devicePort === null) {
    return {
      configured: false,
      message: "TUYA_DEVICE_PORT must be between 1 and 65535 (default 6668).",
    };
  }
  if (!Number.isInteger(powerDp) || powerDp < 1) {
    return {
      configured: false,
      message: "TUYA_POWER_DP must be a positive integer (default 1).",
    };
  }

  return {
    configured: true,
    deviceId,
    localKey,
    deviceIp,
    devicePort,
    protocolVersion,
    powerDp,
    udpDiscover,
  };
}

/**
 * Prefer per-station Tuya fields from the DB; if those are not usable, fall back to `loadTuyaPlugConfig()` (.env).
 * @param {{ deviceId: string, localKey: string, ipAddress: string }} station
 * @returns {{ configured: false, message: string } | { configured: true, deviceId: string, localKey: string, deviceIp: string, devicePort: number, protocolVersion: string, powerDp: number, udpDiscover: boolean }}
 */
export function resolvePlugConfigForStation(station) {
  const { devicePort, protocolVersion, powerDp, udpDiscover } =
    getTuyaLanTuning();
  if (devicePort === null || !Number.isInteger(powerDp) || powerDp < 1) {
    return loadTuyaPlugConfig();
  }

  const sid =
    typeof station.deviceId === "string" ? station.deviceId.trim() : "";
  const key =
    typeof station.localKey === "string" ? station.localKey.trim() : "";
  const ip =
    typeof station.ipAddress === "string" ? station.ipAddress.trim() : "";

  if (sid && key.length === 16 && ip) {
    return {
      configured: true,
      deviceId: sid,
      localKey: key,
      deviceIp: ip,
      devicePort,
      protocolVersion,
      powerDp,
      udpDiscover,
    };
  }

  return loadTuyaPlugConfig();
}
