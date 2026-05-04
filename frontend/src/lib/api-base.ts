/**
 * API origin from Vite env. Returns `undefined` if unset.
 * Prefer `VITE_API_BASE_URL`; falls back to `VITE_API_URL` for older configs.
 * Align with backend `HOST`/`PORT` and include the frontend origin in backend `CORS_ORIGIN`.
 */
export function getApiBaseUrl(): string | undefined {
  const raw =
    import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL;
  if (raw === undefined || String(raw).trim() === "") {
    return undefined;
  }
  return String(raw).trim().replace(/\/$/, "");
}
