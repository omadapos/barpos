const STORAGE_KEY = 'barpos_app_key';
const DEFAULT_APP_KEY = '5be7a996-fddb-44a5-a0d2-6a3ca140199d';

export function getAppKey(): string {
  return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_APP_KEY || DEFAULT_APP_KEY;
}

export function setAppKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key.trim());
}
