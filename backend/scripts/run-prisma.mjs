import "dotenv/config";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncDatabaseUrlFromParts } from "../src/db/databaseUrl.js";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(backendRoot);

syncDatabaseUrlFromParts();

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/run-prisma.mjs <prisma subcommand> [options]");
  process.exit(1);
}

const result = spawnSync("pnpm", ["exec", "prisma", ...args], {
  stdio: "inherit",
  env: process.env,
  cwd: backendRoot,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
