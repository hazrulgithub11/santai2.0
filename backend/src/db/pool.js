import pg from "pg";
import { syncDatabaseUrlFromParts } from "./databaseUrl.js";

syncDatabaseUrlFromParts();

const globalForPool = globalThis;

export const pool =
  globalForPool.pgPool ??
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}
