import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
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

  const openTable = async (table: Table) => {
    setLoading(true);
    try {
      let order = null;
      try {
        order = await ordersApi.getByTable(table.id);
      } catch (e) {
        const notFound = axios.isAxiosError(e) && e.response?.status === 404;
        if (!notFound) throw e;
      }

      if (!order) {
        const created = await ordersApi.create({ tableId: table.id, notes: table.name });
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
        notes: 'Ticket Directo',
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
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg-subtle)] overflow-hidden">
      {loading && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <Spinner className="h-14 w-14 border-t-[var(--green)]" />
        </div>
      )}

      {/* Header Premium con Glassmorphism */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-white/70 px-8 py-5 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-black text-[var(--text)] tracking-tight">Mapa de Mesas</h1>
          <p className="text-[10px] font-extrabold text-[var(--text3)] uppercase tracking-[0.2em]">Selección de Ubicación</p>
        </div>
        <button
          type="button"
          onClick={() => setManagerOpen(true)}
          className="app-no-drag rounded-2xl border border-[var(--border)] bg-white px-5 py-2.5 text-xs font-black text-[var(--text2)] shadow-sm transition-all hover:bg-[var(--bg3)] active:scale-95"
        >
          ⚙️ GESTIONAR MESAS
        </button>
      </div>

      {/* Grid de Mesas con Scroll */}
      <div className="min-h-0 flex-1 overflow-y-auto p-8 scrollbar-none scroll-smooth">
        <div className="mx-auto grid max-w-7xl grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
          {activeTables.map((t) => {
            const m = meta(t.id);
            const occ = (m?.itemCount ?? 0) > 0;
            return (
              <TableCard
                key={t.id}
                table={t}
                occupied={occ}
                itemCount={m?.itemCount}
                total={m?.total}
                createdAt={m?.createdAt}
                onOpen={() => openTable(t)}
                onViewOrder={() => viewOrder(t)}
              />
            );
          })}
        </div>
      </div>

      {/* Barra Inferior (Sticky) */}
      <div className="shrink-0 border-t border-[var(--border)] bg-white/50 p-6 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => void walkIn()}
            disabled={loading}
            className="app-no-drag flex min-h-[90px] w-full items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed border-[var(--border2)] bg-white/40 text-xl font-black text-[var(--text)] shadow-xl transition-all hover:border-[var(--green)] hover:bg-white active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--green-pale)] text-[var(--green)]">
              <Ticket className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="leading-tight">VENTA DIRECTA</div>
              <div className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-widest">Sin asignar mesa</div>
            </div>
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
