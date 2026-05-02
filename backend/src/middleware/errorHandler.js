export function createErrorHandler(config) {
  return function errorHandler(err, _req, res, _next) {
    const status = Number(err.status ?? err.statusCode) || 500;
    const exposeMessage =
      config.nodeEnv !== "production" || status < 500;
    const message = exposeMessage
      ? err.message || "Request failed"
      : "Internal Server Error";

    if (status >= 500) {
      console.error(err);
    }

    res.status(status).json({ error: { message } });
  };
}
