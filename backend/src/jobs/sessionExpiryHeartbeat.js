import { resolvePlugConfigForStation } from "../config.js";
import { prisma } from "../db/prisma.js";
import { createTuyaPlugService } from "../services/tuyaPlugService.js";

const INTERVAL_MS = 1_000;

/**
 * Polls for sessions past endTime and marks them finished; clears station active flag.
 * After each close, turns the Tuya plug off (same config rules as start-session / `/api/plug/off`).
 * @param {import("@prisma/client").PrismaClient} [client]
 */
export function startSessionExpiryHeartbeat(client = prisma) {
  const tick = async () => {
    const now = new Date();
    try {
      const expired = await client.session.findMany({
        where: {
          isFinished: false,
          endTime: { lte: now },
        },
        include: { station: true },
      });

      for (const session of expired) {
        const didClose = await client.$transaction(async (tx) => {
          const updated = await tx.session.updateMany({
            where: { id: session.id, isFinished: false },
            data: { isFinished: true },
          });
          if (updated.count === 0) {
            return false;
          }

          await tx.station.update({
            where: { id: session.stationId },
            data: { isActive: false },
          });

          return true;
        });

        if (!didClose) {
          continue;
        }

        const plugCfg = resolvePlugConfigForStation(session.station);
        if (!plugCfg.configured) {
          continue;
        }
        try {
          const plug = createTuyaPlugService(plugCfg);
          await plug.setOff();
        } catch (plugErr) {
          console.error(
            "[session-expiry-heartbeat] Tuya setOff failed:",
            plugErr instanceof Error ? plugErr.message : plugErr,
          );
        }
      }
    } catch (err) {
      console.error("[session-expiry-heartbeat]", err);
    }
  };

  const id = setInterval(tick, INTERVAL_MS);
  void tick();
  return () => clearInterval(id);
}
