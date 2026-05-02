/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Solo desarrollo: `true` → proxy /api → 127.0.0.1:3001 en lugar de la API remota. */
  readonly VITE_USE_LOCAL_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
