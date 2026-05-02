import React, { useRef, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { formatMoney } from '@/lib/format';

function LineRow({ item, onQty, onRemove }) {
  const startX = useRef(null);
  const [offset, setOffset] = useState(0);

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e) => {
    if (startX.current == null) return;
    const dx = e.touches[0].clientX - startX.current;
    setOffset(Math.min(0, dx));
  };
  const onTouchEnd = () => {
    if (offset < -80) onRemove(item.id);
    setOffset(0);
    startX.current = null;
  };

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-slate-600 bg-slate-800/80"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex flex-col gap-2 p-3 transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
      >
        <div className="flex justify-between gap-2">
          <span className="font-medium text-white">{item.product_name}</span>
          <button
            type="button"
            className="shrink-0 rounded-lg bg-slate-700 p-1 hover:bg-red-900/80"
            onClick={() => onRemove(item.id)}
            aria-label="Quitar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-300">
          <span>P. unit. {formatMoney(item.unit_price)}</span>
          <span className="font-semibold text-emerald-400">{formatMoney(item.subtotal)}</span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            className="flex h-12 min-w-[48px] items-center justify-center rounded-xl bg-slate-700 text-xl font-bold hover:bg-slate-600"
            onClick={() => onQty(item.id, item.quantity - 1)}
          >
            <Minus className="h-6 w-6" />
          </button>
          <span className="min-w-[2rem] text-center text-xl font-bold">{item.quantity}</span>
          <button
            type="button"
            className="flex h-12 min-w-[48px] items-center justify-center rounded-xl bg-slate-700 text-xl font-bold hover:bg-slate-600"
            onClick={() => onQty(item.id, item.quantity + 1)}
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TicketPanel({
  title,
  items,
  subtotal,
  tax,
  total,
  taxPercent,
  onQuantity,
  onRemove,
  onCancelOrder,
  onPay,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col border-l border-slate-700 bg-slate-900">
      <div className="shrink-0 border-b border-slate-700 px-4 py-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {(items || []).length === 0 && (
          <p className="text-center text-slate-500">Sin artículos aún</p>
        )}
        {(items || []).map((it) => (
          <LineRow key={it.id} item={it} onQty={onQuantity} onRemove={onRemove} />
        ))}
      </div>
      <div className="shrink-0 border-t border-slate-700 bg-slate-950 px-4 py-4">
        <div className="mb-2 flex justify-between text-slate-300">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        <div className="mb-2 flex justify-between text-slate-300">
          <span>Impuesto ({taxPercent}%)</span>
          <span>{formatMoney(tax)}</span>
        </div>
        <div className="mb-4 flex justify-between text-2xl font-bold text-white">
          <span>Total</span>
          <span>{formatMoney(total)}</span>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancelOrder}
            className="min-h-[52px] flex-1 rounded-xl bg-slate-700 text-lg font-semibold hover:bg-slate-600"
          >
            🗑️ Cancelar orden
          </button>
          <button
            type="button"
            onClick={onPay}
            disabled={!items?.length}
            className="min-h-[52px] flex-[2] rounded-xl bg-emerald-600 text-lg font-bold hover:bg-emerald-500 disabled:opacity-40"
          >
            💳 Cobrar
          </button>
        </div>
      </div>
    </div>
  );
}
