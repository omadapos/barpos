import { create } from 'zustand';
import { api } from '@/api/client';

interface ConnectionStore {
  online: boolean;
  checking: boolean;
  check: () => Promise<void>;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  online: true,
  checking: false,

  check: async () => {
    set({ checking: true });
    try {
      await api.get('/health', { skipErrorToast: true, timeout: 5000 });
      set({ online: true, checking: false });
    } catch {
      set({ online: false, checking: false });
    }
  },
}));
