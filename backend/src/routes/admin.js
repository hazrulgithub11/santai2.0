import { Router } from "express";
import { resolvePlugConfigForStation } from "../config.js";
import { prisma } from "../db/prisma.js";
import { createTuyaPlugService } from "../services/tuyaPlugService.js";

export const adminRouter = Router();

adminRouter.post("/start-session", async (req, res, next) => {
  try {
    const { stationId, minutes } = req.body ?? {};

    if (
      typeof stationId !== "number" ||
      !Number.isInteger(stationId) ||
      stationId < 1
    ) {
      const err = new Error("body.stationId must be a positive integer");
      err.status = 400;
      throw err;
    }
    if (
      typeof minutes !== "number" ||
      !Number.isFinite(minutes) ||
      minutes <= 0 ||
      !Number.isInteger(minutes)
    ) {
      const err = new Error("body.minutes must be a positive integer");
      err.status = 400;
      throw err;
    }

    const endTime = new Date(Date.now() + minutes * 60_000);

    const result = await prisma.$transaction(async (tx) => {
      const station = await tx.station.findUnique({
        where: { id: stationId },
      });
      if (!station) {
        const err = new Error(`Station ${stationId} not found`);
        err.status = 404;
        throw err;
      }

      const session = await tx.session.create({
        data: {
          stationId,
          endTime,
          isFinished: false,
        },
      });

      await tx.station.update({
        where: { id: stationId },
        data: { isActive: true },
      });

      return { session, station };
    });

    const plugCfg = resolvePlugConfigForStation(result.station);
    if (plugCfg.configured) {
      try {
        const plug = createTuyaPlugService(plugCfg);
        await plug.setOn();
      } catch (plugErr) {
        await prisma.$transaction(async (tx) => {
          await tx.session.delete({ where: { id: result.session.id } });
          await tx.station.update({
            where: { id: stationId },
            data: { isActive: false },
          });
        });
        const msg =
          plugErr instanceof Error ? plugErr.message : "Plug did not turn on";
        const err = new Error(`Session was not started: ${msg}`);
        err.status = 502;
        throw err;
      }
    }

    return res.status(201).json({
      ok: true,
      session: {
        id: result.session.id,
        stationId: result.session.stationId,
        startTime: result.session.startTime,
        endTime: result.session.endTime,
        isFinished: result.session.isFinished,
      },
    });
  } catch (e) {
    next(e);
  }
});
