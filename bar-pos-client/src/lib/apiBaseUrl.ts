/**
 * Backend remoto unico de Bar POS. La URL base va sin `/api`; las rutas del
 * cliente ya agregan `/api/...`.
 */
export const DEFAULT_REMOTE_API_BASE = 'https://barpos.omadapos.com';

function normalizeApiBaseURL(value: string): string {
  return value.trim().replace(/\/+$/, '').replace(/\/api$/, '');
}

export function getApiBaseURL(): string {
  const fromVite = import.meta.env.VITE_API_URL?.trim();

  if (typeof window !== 'undefined' && window.electronEnv?.isElectron) {
    const pre = window.electronEnv.apiBaseUrl?.trim();
    if (pre) return normalizeApiBaseURL(pre);
  }

  if (fromVite) return normalizeApiBaseURL(fromVite);
  return DEFAULT_REMOTE_API_BASE;
}
