import { Router } from "express";
import { prisma } from "../db/prisma.js";

export const stationsRouter = Router();

stationsRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await prisma.station.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        isActive: true,
        sessions: {
          where: { isFinished: false },
          take: 1,
          select: {
            id: true,
            stationId: true,
            startTime: true,
            endTime: true,
            isFinished: true,
          },
        },
      },
    });

    const stations = rows.map(({ sessions, ...station }) => ({
      ...station,
      activeSession: sessions[0] ?? null,
    }));

    return res.json({ ok: true, stations });
  } catch (e) {
    next(e);
  }
});
