import axios, { type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
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

    if (err.response?.status === 401) {
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
