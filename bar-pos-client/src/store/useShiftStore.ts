import { create } from 'zustand';
import { shiftsApi, type Shift, type ShiftSummary } from '@/api/shifts.api';

interface ShiftStore {
  currentShift: Shift | null;
  summary: ShiftSummary | null;
  loading: boolean;
  checkCurrentShift: () => Promise<Shift | null>;
  openShift: (openingCash: number) => Promise<void>;
  loadSummary: () => Promise<ShiftSummary | null>;
  closeShift: (closingCash: number, notes?: string) => Promise<ShiftSummary | null>;
  clearShift: () => void;
}

export const useShiftStore = create<ShiftStore>((set, get) => ({
  currentShift: null,
  summary: null,
  loading: false,

  checkCurrentShift: async () => {
    set({ loading: true });
    try {
      const currentShift = await shiftsApi.current();
      set({ currentShift, loading: false });
      return currentShift;
    } catch {
      set({ currentShift: null, loading: false });
      return null;
    }
  },

  openShift: async (openingCash) => {
    const currentShift = await shiftsApi.open({ openingCash });
    set({ currentShift, summary: null });
  },

  loadSummary: async () => {
    const { currentShift } = get();
    if (!currentShift?.id) return null;
    const summary = await shiftsApi.summary(currentShift.id);
    set({ summary });
    return summary;
  },

  closeShift: async (closingCash, notes) => {
    const result = await shiftsApi.close({ closingCash, notes: notes?.trim() || undefined });
    const summary =
      result && typeof result === 'object' && 'summary' in result
        ? (result.summary as ShiftSummary | undefined) ?? null
        : null;
    set({ currentShift: null, summary: null });
    return summary;
  },

  clearShift: () => set({ currentShift: null, summary: null, loading: false }),
}));
