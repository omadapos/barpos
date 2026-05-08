import { create } from 'zustand';
import type { Order, Table } from '@/types';
import { tablesApi } from '@/api/tables.api';
import { ordersApi } from '@/api/orders.api';

function normalizeTable(t: Table): Table {
  const rawActive = (t as unknown as { active?: boolean | number | string }).active;
  const normalizedActive =
    typeof rawActive === 'string' ? rawActive.trim().toLowerCase() : rawActive;
  const active =
    normalizedActive == null
      ? true
      : !(
          normalizedActive === false ||
          normalizedActive === 0 ||
          normalizedActive === 'false' ||
          normalizedActive === '0' ||
          normalizedActive === 'f' ||
          normalizedActive === 'no'
        );

  return {
    ...t,
    active,
  };
}

interface TableStore {
  tables: Table[];
  openOrders: Record<
    number,
    Pick<Order, 'id' | 'total' | 'itemCount'> & { createdAt?: string }
  >;
  fetchTables: () => Promise<void>;
  fetchOpenOrders: () => Promise<void>;
  refresh: () => Promise<void>;
  hideTableLocally: (tableId: number | null | undefined) => void;
}

export const useTableStore = create<TableStore>((set) => ({
  tables: [],
  openOrders: {},

  fetchTables: async () => {
    const tables = await tablesApi.getAll();
    set({ tables: tables.map(normalizeTable) });
  },

  fetchOpenOrders: async () => {
    const orders = await ordersApi.getOpen();
    const map: Record<
      number,
      Pick<Order, 'id' | 'total' | 'itemCount'> & { createdAt?: string }
    > = {};
    orders.filter((o) => o.status === 'open').forEach((o) => {
      if (o.tableId != null) {
        map[o.tableId] = {
          id: o.id,
          total: o.total ?? 0,
          itemCount: o.itemCount ?? o.items?.length ?? 0,
          createdAt: o.createdAt,
        };
      }
    });
    set({ openOrders: map });
  },

  refresh: async () => {
    const [tables, orders] = await Promise.all([
      tablesApi.getAll(),
      ordersApi.getOpen(),
    ]);
    const map: Record<
      number,
      Pick<Order, 'id' | 'total' | 'itemCount'> & { createdAt?: string }
    > = {};
    orders.filter((o) => o.status === 'open').forEach((o) => {
      if (o.tableId != null) {
        map[o.tableId] = {
          id: o.id,
          total: o.total ?? 0,
          itemCount: o.itemCount ?? o.items?.length ?? 0,
          createdAt: o.createdAt,
        };
      }
    });
    set({ tables: tables.map(normalizeTable), openOrders: map });
  },

  hideTableLocally: (tableId) => {
    if (tableId == null) return;
    set((state) => {
      const nextOpenOrders = { ...state.openOrders };
      delete nextOpenOrders[tableId];
      return {
        tables: state.tables.map((t) =>
          t.id === tableId ? { ...t, active: false } : t
        ),
        openOrders: nextOpenOrders,
      };
    });
  },
}));
