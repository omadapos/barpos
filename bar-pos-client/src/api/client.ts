import axios, { type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { getAppKey } from '@/config/tenant';
import { getApiBaseURL } from '@/lib/apiBaseUrl';
import { useAuthStore } from '@/store/useAuthStore';

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

  const appKey = getAppKey();
  if (appKey) {
    config.headers['x-app-key'] = appKey;
  }

  const token = useAuthStore.getState().token;
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

    if (import.meta.env.DEV) {
      console.error('[API] Response error', {
        baseURL: cfg?.baseURL,
        url,
        status,
        body: err.response?.data,
        message: err.message,
      });
    }

    if (status === 401) {
      useAuthStore.getState().clearAuth();
      if (!cfg?.skipErrorToast && !isLoginPin) {
        toast.error('Sesion expirada o no autorizado');
      }
      return Promise.reject(err);
    }

    const raw = err.response?.data?.error ?? err.response?.data?.message;
    const noOpenShift = raw === 'no_open_shift' || err.response?.data?.code === 'no_open_shift';
    if (noOpenShift && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barpos:no-open-shift'));
    }

    if (!cfg?.skipErrorToast) {
      const msg =
        noOpenShift
          ? 'Debes abrir un turno antes de operar.'
          : typeof raw === 'string'
          ? raw
          : raw != null
            ? JSON.stringify(raw)
            : 'Error de conexion con el servidor';
      toast.error(msg);
    }

    return Promise.reject(err);
  }
);
