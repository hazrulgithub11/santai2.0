/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the backend API (no trailing slash). Set in `.env`; see `.env.example`. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
