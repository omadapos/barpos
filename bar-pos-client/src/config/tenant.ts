const DEFAULT_APP_KEY = '7610df99-c33f-4e08-b989-554580302fc7';

export function getAppKey(): string {
  return import.meta.env.VITE_APP_KEY || DEFAULT_APP_KEY;
}
