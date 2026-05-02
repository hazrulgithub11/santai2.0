import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import pino from "pino";
import { apiRouter } from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { createErrorHandler } from "./middleware/errorHandler.js";

export function createApp(config) {
  const app = express();

  if (config.trustProxy) {
    app.set("trust proxy", 1);
  }

  const logger = pino({ level: config.logLevel });
  app.use(
    pinoHttp({
      logger,
      autoLogging: true,
    }),
  );

  app.use(helmet());
  app.use(express.json());

  if (config.corsOrigins.length > 0) {
    app.use(
      cors({
        origin: config.corsOrigins,
        credentials: true,
      }),
    );
  }

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(createErrorHandler(config));

  return app;
}
