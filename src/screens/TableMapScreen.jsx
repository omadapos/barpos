import React, { useEffect, useState } from 'react';
import { BarChart3, Settings2, Armchair } from 'lucide-react';
import Navbar from '@/components/Navbar.jsx';
import TableCard from '@/components/TableCard.jsx';
import TableManagerModal from '@/components/TableManagerModal.jsx';
import TaxSettingsModal from '@/components/TaxSettingsModal.jsx';
import { useTableStore } from '@/store/useTableStore';
import { useOrderStore } from '@/store/useOrderStore';

export default function TableMapScreen({ onOpenOrder, onReports }) {
  const { tables, openOrders, openOrdersList, refreshAll } = useTableStore();
  const clearLocalOrder = useOrderStore((s) => s.clearLocalOrder);
  const [managerOpen, setManagerOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(false);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const activeTables = (tables || []).filter((t) => t.active);

  const metaForTable = (tableId) => {
    const o = (openOrdersList || []).find(
      (x) => x.table_id === tableId && x.status === 'open'
    );
    return o
      ? { orderId: o.id, itemCount: o.item_count, total: o.total }
      : null;
  };

  const openTable = async (table) => {
    clearLocalOrder();
    const m = metaForTable(table.id);
    await onOpenOrder({
      tableId: table.id,
      tableName: table.name,
      orderId: m?.orderId,
    });
  };

  const viewOrder = async (table) => {
    const m = metaForTable(table.id);
    if (!m?.orderId) return;
    clearLocalOrder();
    await onOpenOrder({
      tableId: table.id,
      tableName: table.name,
      orderId: m.orderId,
    });
  };

  const walkIn = async () => {
    clearLocalOrder();
    await onOpenOrder({ tableId: null, tableName: null, orderId: null });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950">
      <Navbar
        title="Bar POS"
        right={
          <>
            <button
              type="button"
              onClick={() => setTaxOpen(true)}
              className="flex min-h-[48px] items-center gap-2 rounded-xl bg-slate-800 px-4 font-semibold hover:bg-slate-700"
            >
              <Settings2 className="h-5 w-5" />
              Impuesto
            </button>
            <button
              type="button"
              onClick={onReports}
              className="flex min-h-[48px] items-center gap-2 rounded-xl bg-slate-800 px-4 font-semibold hover:bg-slate-700"
            >
              <BarChart3 className="h-5 w-5" />
              Reportes
            </button>
            <button
              type="button"
              onClick={() => setManagerOpen(true)}
              className="flex min-h-[48px] items-center gap-2 rounded-xl bg-indigo-700 px-4 font-semibold hover:bg-indigo-600"
            >
              <Armchair className="h-5 w-5" />
              Gestionar mesas
            </button>
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {activeTables.map((t) => {
            const occ = !!openOrders[t.id];
            const m = metaForTable(t.id);
            return (
              <TableCard
                key={t.id}
                table={t}
                occupied={occ}
                itemCount={m?.itemCount}
                total={m?.total}
                onOpen={() => openTable(t)}
                onViewOrder={() => viewOrder(t)}
              />
            );
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-800 bg-slate-900 p-4">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={walkIn}
            className="min-h-[80px] w-full rounded-2xl bg-fuchsia-700 text-xl font-bold shadow-lg hover:bg-fuchsia-600"
          >
            🎫 Ticket directo
          </button>
        </div>
      </div>

      <TableManagerModal open={managerOpen} onClose={() => setManagerOpen(false)} />
      <TaxSettingsModal open={taxOpen} onClose={() => setTaxOpen(false)} />
    </div>
  );
}
