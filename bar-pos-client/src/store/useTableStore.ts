import { create } from 'zustand';
import type { Order, Table } from '@/types';
import { tablesApi } from '@/api/tables.api';
import { ordersApi } from '@/api/orders.api';

function normalizeTable(t: Table): Table {
  return {
    ...t,
    active: Boolean((t as unknown as { active?: boolean | number }).active),
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
    orders.forEach((o) => {
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
    orders.forEach((o) => {
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
}));
