/**
 * Origen del backend (sin path `/api`).
 * Producción pública: https://barpos.omadapos.com
 * Rutas REST: /api/categories, /api/orders, … | Salud: GET /health
 * @see electron/preload.js (misma URL por defecto)
 */
export const DEFAULT_REMOTE_API_BASE = 'https://barpos.omadapos.com';

/**
 * Resuelve la base URL del servidor (solo host, sin `/api`).
 *
 * **Desarrollo:** `VITE_API_URL` → si no, `VITE_USE_LOCAL_PROXY=true` → proxy Vite (127.0.0.1:3001) → si no, remoto.
 * **Producción + Electron:** `electronEnv.apiBaseUrl` (preload / `API_URL` al lanzar) para no usar un `VITE_*` viejo horneado.
 * **Producción web:** `VITE_API_URL` del build → si no, remoto.
 */
export function getApiBaseURL(): string {
  const remote = DEFAULT_REMOTE_API_BASE;
  const fromVite = import.meta.env.VITE_API_URL?.trim();

  if (import.meta.env.DEV) {
    if (fromVite) return fromVite.replace(/\/$/, '');
    if (import.meta.env.VITE_USE_LOCAL_PROXY === 'true') return '';
    return remote;
  }

  if (typeof window !== 'undefined' && window.electronEnv?.isElectron) {
    const pre = window.electronEnv.apiBaseUrl?.trim();
    if (pre) return pre.replace(/\/$/, '');
    return remote;
  }

  if (fromVite) return fromVite.replace(/\/$/, '');
  return remote;
}
