import { Router } from "express";
import { loadTuyaPlugConfig } from "../config.js";
import { createTuyaPlugService } from "../services/tuyaPlugService.js";

export const plugRouter = Router();

function notConfigured(res, message) {
  console.warn("[tuya-plug] not configured:", message);
  return res.status(503).json({
    ok: false,
    error: { code: "TUYA_NOT_CONFIGURED", message },
  });
}

function deviceError(res, err) {
  const message =
    err instanceof Error ? err.message : "Device communication failed";
  console.error("[tuya-plug] device error:", message);
  return res.status(502).json({
    ok: false,
    error: { code: "TUYA_DEVICE_ERROR", message },
  });
}

plugRouter.get("/status", async (_req, res) => {
  const cfg = loadTuyaPlugConfig();
  if (!cfg.configured) {
    return notConfigured(res, cfg.message);
  }
  try {
    const service = createTuyaPlugService(cfg);
    const { on, dps } = await service.getStatus();
    return res.json({
      ok: true,
      on,
      dps,
    });
  } catch (err) {
    return deviceError(res, err);
  }
});

plugRouter.post("/on", async (_req, res) => {
  const cfg = loadTuyaPlugConfig();
  if (!cfg.configured) {
    return notConfigured(res, cfg.message);
  }
  try {
    const service = createTuyaPlugService(cfg);
    const { on } = await service.setOn();
    return res.json({ ok: true, on });
  } catch (err) {
    return deviceError(res, err);
  }
});

plugRouter.post("/off", async (_req, res) => {
  const cfg = loadTuyaPlugConfig();
  if (!cfg.configured) {
    return notConfigured(res, cfg.message);
  }
  try {
    const service = createTuyaPlugService(cfg);
    const { on } = await service.setOff();
    return res.json({ ok: true, on });
  } catch (err) {
    return deviceError(res, err);
  }
});
