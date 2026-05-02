import { create } from 'zustand';

export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

/**
 * Sesión solo en memoria: cada vez que abres el POS hace falta el PIN.
 * (Antes usábamos persist/localStorage y por eso entraba directo a mesas.)
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  clearAuth: () => set({ token: null, user: null }),
  isAuthenticated: () => !!get().token,
}));

/** Limpia datos viejos de versiones que guardaban sesión en localStorage. */
try {
  localStorage.removeItem('barpos-auth');
} catch {
  /* ignorar (modo privado, etc.) */
}
