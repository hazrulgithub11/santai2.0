import { startSessionExpiryHeartbeat } from "./jobs/sessionExpiryHeartbeat.js";

/**
 * Starts HTTP listener and background jobs (session expiry + Tuya off).
 * This repo uses JavaScript; if you migrate to TypeScript, rename to `server.ts`
 * and keep the same exports.
 *
 * @param {import("express").Express} app
 * @param {{ host: string; port: number; nodeEnv: string }} config
 */
export function startServer(app, config) {
  const server = app.listen(config.port, config.host, () => {
    console.log(
      `Listening on http://${config.host}:${config.port} (${config.nodeEnv})`,
    );
  });

  const stopHeartbeat = startSessionExpiryHeartbeat();

  const shutdown = () => {
    stopHeartbeat();
    server.close();
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  return server;
}
