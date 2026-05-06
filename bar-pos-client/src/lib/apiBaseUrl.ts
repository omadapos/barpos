export const DEFAULT_REMOTE_API_BASE = 'https://barpos.omadapos.com';

function normalizeApiBaseURL(value: string): string {
  return value.trim().replace(/\/+$/, '').replace(/\/api$/, '');
}

export function getApiBaseURL(): string {
  const fromElectron =
    typeof window !== 'undefined' ? window.electronEnv?.apiBaseUrl?.trim() : undefined;
  const fromVite = import.meta.env.VITE_API_URL?.trim();

  return normalizeApiBaseURL(fromElectron || fromVite || DEFAULT_REMOTE_API_BASE);
}
