import "dotenv/config";
import pg from "pg";
import {
  syncDatabaseUrlFromParts,
  buildPostgresUrl,
  getDbParts,
  quoteIdent,
} from "../src/db/databaseUrl.js";

syncDatabaseUrlFromParts();

const { user, password, host, port, database } = getDbParts();

const adminUrl = buildPostgresUrl({
  user,
  password,
  host,
  port,
  database: "postgres",
});

const client = new pg.Client({ connectionString: adminUrl });
await client.connect();

try {
  const { rows } = await client.query(
    "SELECT 1 AS ok FROM pg_database WHERE datname = $1",
    [database],
  );
  if (rows.length === 0) {
    await client.query(`CREATE DATABASE ${quoteIdent(database)}`);
    console.log(`Created database "${database}".`);
  } else {
    console.log(`Database "${database}" already exists.`);
  }
} finally {
  await client.end();
}
