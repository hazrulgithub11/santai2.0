/**
 * Build PostgreSQL URL for Prisma / pg from split env vars (no secrets in code).
 * If DATABASE_URL is set, it wins and is returned unchanged.
 */

export function parseDbPort(raw) {
  if (raw === undefined || raw === "") {
    return 5432;
  }
  const n = Number.parseInt(String(raw).trim(), 10);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    return 5432;
  }
  return n;
}

const IDENT_SAFE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/** Safe quoted identifier for CREATE DATABASE (alphanumeric + underscore only). */
export function quoteIdent(name) {
  if (!IDENT_SAFE.test(name)) {
    throw new Error(
      `DB_NAME must match ${IDENT_SAFE} for automated CREATE DATABASE; got unsafe value.`,
    );
  }
  return `"${name.replace(/"/g, '""')}"`;
}

export function getDbParts() {
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const host = process.env.DB_HOST?.trim() || "localhost";
  const database = process.env.DB_NAME?.trim();
  const port = parseDbPort(process.env.DB_PORT);

  if (!user) {
    throw new Error("DB_USER is required when DATABASE_URL is unset.");
  }
  if (!database) {
    throw new Error("DB_NAME is required when DATABASE_URL is unset.");
  }

  return { user, password, host, port, database };
}

export function buildPostgresUrl({
  user,
  password,
  host,
  port,
  database,
  schema = "public",
}) {
  const u = encodeURIComponent(user);
  const p = encodeURIComponent(password);
  const s = encodeURIComponent(schema);
  return `postgresql://${u}:${p}@${host}:${port}/${database}?schema=${s}`;
}

/**
 * Ensures process.env.DATABASE_URL is set for Prisma CLI and @prisma/client.
 * @returns {string}
 */
export function syncDatabaseUrlFromParts() {
  const existing = process.env.DATABASE_URL?.trim();
  if (existing) {
    return existing;
  }

  const parts = getDbParts();
  const url = buildPostgresUrl(parts);
  process.env.DATABASE_URL = url;
  return url;
}
