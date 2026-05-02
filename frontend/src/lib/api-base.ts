/**
 * API origin from Vite env. Returns `undefined` if `VITE_API_URL` is unset.
 * Align `VITE_API_URL` with backend `HOST`/`PORT` and include the frontend origin in `CORS_ORIGIN`.
 */
export function getApiBaseUrl(): string | undefined {
  const raw = import.meta.env.VITE_API_URL;
  if (raw === undefined || String(raw).trim() === "") {
    return undefined;
  }
  return String(raw).trim().replace(/\/$/, "");
}
