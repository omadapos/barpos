import { useCallback, useEffect, useState } from 'react';
import { Ticket } from 'lucide-react';
import TableCard from '@/components/TableCard';
import TableManagerModal from '@/components/TableManagerModal';
import Spinner from '@/components/Spinner';
import type { Table } from '@/types';
import { ordersApi } from '@/api/orders.api';
import { useTableStore } from '@/store/useTableStore';
import { useOrderStore } from '@/store/useOrderStore';

/** Evita doble “Ticket directo” en React StrictMode (ref se resetea al remount). */
let gLastWalkInTick = 0;

type Props = {
  walkInTick: number;
  onNavigateOrder: () => void;
};

export default function TableMapScreen({ walkInTick, onNavigateOrder }: Props) {
  const { tables, openOrders, refresh } = useTableStore();
  const setCurrentOrder = useOrderStore((s) => s.setCurrentOrder);
  const setActiveCategory = useOrderStore((s) => s.setActiveCategory);
  const [managerOpen, setManagerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => {
      refresh().catch(() => {});
    }, 15_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const activeTables = tables.filter((t) => t.active);

  const meta = (tableId: number) => openOrders[tableId];

  const hydrateOrder = useCallback(
    async (order: { id: number }) => ordersApi.getById(order.id),
    []
  );

  const openTable = async (table: Table, occupied: boolean) => {
    setLoading(true);
    try {
      let order;
      if (occupied) {
        order = await ordersApi.getByTable(table.id);
      } else {
        const created = await ordersApi.create({ tableId: table.id, tableName: table.name });
        order = await hydrateOrder(created);
      }
      setCurrentOrder(order);
      setActiveCategory(null);
      onNavigateOrder();
    } finally {
      setLoading(false);
    }
  };

  const viewOrder = async (table: Table) => {
    const m = meta(table.id);
    if (!m) return;
    setLoading(true);
    try {
      const order = await ordersApi.getById(m.id);
      setCurrentOrder(order);
      setActiveCategory(null);
      onNavigateOrder();
    } finally {
      setLoading(false);
    }
  };

  const walkIn = useCallback(async () => {
    setLoading(true);
    try {
      const created = await ordersApi.create({
        tableId: null,
        tableName: 'Ticket Directo',
      });
      const order = await hydrateOrder(created);
      setCurrentOrder(order);
      setActiveCategory(null);
      onNavigateOrder();
    } finally {
      setLoading(false);
    }
  }, [hydrateOrder, onNavigateOrder, setActiveCategory, setCurrentOrder]);

  useEffect(() => {
    if (walkInTick <= 0 || walkInTick <= gLastWalkInTick) return;
    gLastWalkInTick = walkInTick;
    void walkIn();
  }, [walkInTick, walkIn]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg)]">
      {loading && (
        <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/25">
          <Spinner className="h-12 w-12 border-t-[var(--green)]" />
        </div>
      )}

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
        <h1 className="text-xl font-bold text-[var(--text)]">Mesas</h1>
        <button
          type="button"
          onClick={() => setManagerOpen(true)}
          className="app-no-drag min-h-[44px] rounded-[var(--radius)] border border-[var(--green2)] px-4 text-sm font-semibold text-[var(--green)] transition hover:bg-[var(--green-dim)] active:scale-[0.97]"
        >
          + Gestionar mesas
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-emerald">
        <div className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {activeTables.map((t) => {
            const occ = !!openOrders[t.id];
            const m = meta(t.id);
            return (
              <TableCard
                key={t.id}
                table={t}
                occupied={occ}
                itemCount={m?.itemCount}
                total={m?.total}
                createdAt={m?.createdAt}
                onOpen={() => openTable(t, occ)}
                onViewOrder={() => viewOrder(t)}
              />
            );
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg2)] p-4">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => void walkIn()}
            disabled={loading}
            className="app-no-drag flex min-h-[80px] w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border2)] bg-[var(--bg2)] text-lg font-bold text-[var(--text)] transition hover:border-[var(--green)] hover:bg-[var(--bg3)] disabled:opacity-50 active:scale-[0.99]"
          >
            <Ticket className="h-6 w-6 text-[var(--green)]" />
            TICKET DIRECTO — Venta sin mesa
          </button>
        </div>
      </div>

      <TableManagerModal
        open={managerOpen}
        onClose={() => {
          setManagerOpen(false);
          refresh().catch(() => {});
        }}
      />
    </div>
  );
}
