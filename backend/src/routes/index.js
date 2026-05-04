import { Router } from "express";
import { adminRouter } from "./admin.js";
import { healthRouter } from "./health.js";
import { plugRouter } from "./plug.js";
import { stationsRouter } from "./stations.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/plug", plugRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/stations", stationsRouter);
