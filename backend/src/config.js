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
