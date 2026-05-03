export function getAppKey(): string {
  return localStorage.getItem('device_app_key') || import.meta.env.VITE_APP_KEY || '5be7a996-fddb-44a5-a0d2-6a3ca140199d';
}

export function setAppKey(key: string) {
  localStorage.setItem('device_app_key', key.trim());
}
