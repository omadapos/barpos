import { create } from 'zustand';

export const useTableStore = create((set, get) => ({
  tables: [],
  openOrders: {},
  openOrdersList: [],

  fetchTables: async () => {
    const api = window.electronAPI;
    if (!api) return;
    const tables = await api.getTables();
    set({ tables: tables || [] });
  },

  fetchOpenOrders: async () => {
    const api = window.electronAPI;
    if (!api) return;
    const res = await api.getOpenOrders();
    set({
      openOrders: res?.byTableId || {},
      openOrdersList: res?.list || [],
    });
  },

  refreshAll: async () => {
    await get().fetchTables();
    await get().fetchOpenOrders();
  },

  getOrderIdForTable: (tableId) => get().openOrders[tableId],
}));
