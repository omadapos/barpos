import axios, { type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseURL } from '@/lib/apiBaseUrl';
import { useAuthStore } from '@/store/useAuthStore';
import { getAppKey } from '@/config/tenant';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipErrorToast?: boolean;
  }
}

export const api = axios.create({
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseURL();
  const token = useAuthStore.getState().token;
  
  const appKey = getAppKey();
  if (appKey) {
    config.headers['x-app-key'] = appKey;
    // Log para depuración (puedes verlo en la consola de Electron/Chrome)
    console.log(`[API] Request to ${config.url} with AppKey: ${appKey.slice(0, 8)}...`);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const cfg = err.config as InternalAxiosRequestConfig & { skipErrorToast?: boolean };
    const url = cfg?.url ?? '';
    const isLoginPin = url.includes('/api/auth/login-pin');
    const status = err.response?.status;
    const body = err.response?.data;

    console.error('[API] Response error', {
      baseURL: cfg?.baseURL,
      url,
      status,
      body,
      message: err.message,
    });

    if (status === 401) {
      useAuthStore.getState().clearAuth();
      if (!cfg?.skipErrorToast && !isLoginPin) {
        toast.error('Sesión expirada o no autorizado');
      }
      return Promise.reject(err);
    }

    if (!cfg?.skipErrorToast) {
      const raw = err.response?.data?.error ?? err.response?.data?.message;
      const msg =
        typeof raw === 'string'
          ? raw
          : raw != null
            ? JSON.stringify(raw)
            : 'Error de conexión con el servidor';
      toast.error(msg);
    }
    return Promise.reject(err);
  }
);
