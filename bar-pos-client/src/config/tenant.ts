const APP_KEY_STORAGE_KEY = 'barpos-app-key';

export function getAppKey(): string {
  try {
    const stored = localStorage.getItem(APP_KEY_STORAGE_KEY)?.trim();
    if (stored) return stored;
  } catch {
    /* localStorage may be unavailable in some contexts. */
  }

  return import.meta.env.VITE_APP_KEY?.trim() || '';
}

export function saveAppKey(appKey: string): void {
  const trimmed = appKey.trim();
  if (!trimmed) {
    clearAppKey();
    return;
  }
  localStorage.setItem(APP_KEY_STORAGE_KEY, trimmed);
}

export function clearAppKey(): void {
  localStorage.removeItem(APP_KEY_STORAGE_KEY);
}
