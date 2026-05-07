import { useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Minus, Plus, X, ReceiptText, Clock } from 'lucide-react';
import type { OrderItem, Table } from '@/types';
import { formatMoney } from '@/lib/format';
import OrderNoteModal from '@/components/OrderNoteModal';
import MoveTableModal from '@/components/MoveTableModal';

function useElapsedLabel(createdAt: string) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const tick = () => {
      const ms = Date.now() - new Date(createdAt).getTime();
      const min = Math.floor(ms / 60_000);
      if (min < 1) setLabel('reciente');
      else if (min < 60) setLabel(`${min}m`);
      else {
        const h = Math.floor(min / 60);
        const m = min % 60;
        setLabel(m ? `${h}h ${m}m` : `${h}h`);
      }
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [createdAt]);
  return label;
}

function LineRow({
  item,
  onQty,
  onRemove,
  selectable,
  selected,
  onSelect,
}: {
  item: OrderItem;
  onQty: (id: number, q: number) => void;
  onRemove: (id: number) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
}) {
  const startX = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);

  const onTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: TouchEvent) => {
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
      className={`item-enter border-b px-1 py-3 transition-all ${
        selected ? 'border-[var(--green)] bg-[var(--green-dim)]' : 'border-[var(--border)]'
      }`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex items-center justify-between gap-3 transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
      >
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {selectable && (
            <button
              type="button"
              onClick={() => onSelect?.(item.id)}
              className={`app-no-drag mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                selected
                  ? 'border-[var(--green)] bg-[var(--green3)] text-white'
                  : 'border-[var(--border2)] bg-white'
              }`}
            >
              {selected && <span className="text-[10px] font-bold">✓</span>}
            </button>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-[var(--text)]">{item.productName}</div>
            {item.measureName && (
              <div className="text-[10px] font-semibold uppercase text-[var(--text3)]">
                {item.measureName}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[var(--bg3)] rounded-full p-1">
            <button
              type="button"
              className="h-7 w-7 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition-all"
              onClick={() => onQty(item.id, item.quantity - 1)}
              disabled={selectable}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm font-black text-[var(--text)]">
              {item.quantity}
            </span>
            <button
              type="button"
              className="h-7 w-7 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition-all"
              onClick={() => onQty(item.id, item.quantity + 1)}
              disabled={selectable}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          
          <div className="text-right min-w-[70px]">
            <div className="font-black text-[var(--green)] text-sm">{formatMoney(item.subtotal)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  title: string;
  createdAt: string;
  notes?: string | null;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  onQuantity: (itemId: number, qty: number) => void;
  onRemove: (itemId: number) => void;
  onCancelOrder: () => void | Promise<void>;
  onPay: () => void;
  onPrintPreBill?: () => void | Promise<void>;
  includeTip18?: boolean;
  onToggleTip18?: (next: boolean) => void;
  /** Porcentaje de propina (10–25 típico; por defecto 18). */
  tipPercent?: number;
  onTipPercentChange?: (pct: number) => void;
  tipAmount?: number;
  grandTotal?: number;
  onSaveNote: (note: string) => Promise<void>;
  busy?: boolean;
  tables?: Table[];
  currentTableId?: number | null;
  openOrderTableIds?: Set<number>;
  onMoveItems?: (
    items: Array<{ orderItemId: number; quantity: number }>,
    targetTableId: number
  ) => Promise<void>;
  onMerge?: (targetTableId: number) => Promise<void>;
};

export default function TicketPanel({
  title,
  createdAt,
  notes,
  items,
  subtotal,
  tax,
  total,
  onQuantity,
  onRemove,
  onCancelOrder,
  onPay,
  onPrintPreBill,
  includeTip18 = false,
  onToggleTip18,
  tipPercent = 18,
  onTipPercentChange,
  tipAmount = 0,
  grandTotal,
  onSaveNote,
  busy,
  tables = [],
  currentTableId,
  openOrderTableIds = new Set(),
  onMoveItems,
  onMerge,
}: Props) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [moveModal, setMoveModal] = useState<'move' | 'merge' | null>(null);
  const elapsed = useElapsedLabel(createdAt);
  const started = format(new Date(createdAt), 'h:mm a', { locale: es });
  const tipPresets = [10, 12, 15, 18, 20, 22, 25];
  const tipOptions = tipPresets.includes(tipPercent)
    ? tipPresets
    : [...tipPresets, tipPercent].sort((a, b) => a - b);
  const canMove = Boolean(onMoveItems || onMerge) && tables.length > 0;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleTablePick = async (tableId: number) => {
    const mode = moveModal;
    setMoveModal(null);
    if (mode === 'merge') {
      await onMerge?.(tableId);
      return;
    }

    const toMove = Array.from(selectedIds).map((orderItemId) => ({
      orderItemId,
      quantity: items.find((i) => i.id === orderItemId)?.quantity ?? 1,
    }));
    await onMoveItems?.(toMove, tableId);
    exitSelectMode();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 bg-gradient-to-r from-[var(--green)] to-[var(--green3)] p-4 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 opacity-80" />
            <h2 className="text-lg font-black tracking-tight">{title}</h2>
          </div>
          <div className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
            Abierta
          </div>
        </div>
        <div className="flex items-center gap-3 opacity-90">
          <div className="flex items-center gap-1 text-[10px] font-bold">
            <Clock className="h-3 w-3" />
            {started}
          </div>
          <div className="h-1 w-1 rounded-full bg-white/40" />
          <div className="text-[10px] font-bold uppercase tracking-wide">
            Transcurrido: {elapsed}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2 bg-[var(--bg)]">
        <button
          type="button"
          onClick={() => setNoteOpen(true)}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text2)] transition hover:bg-white active:scale-95"
        >
          📝 {notes ? 'Editar Nota' : 'Agregar Nota'}
        </button>
        {notes && (
          <span className="truncate text-[10px] font-medium text-[var(--text3)] italic">"{notes}"</span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 scrollbar-none">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-[var(--text3)] opacity-50">
            <ReceiptText className="h-12 w-12 mb-2" />
            <p className="text-xs font-bold uppercase tracking-widest">Ticket Vacío</p>
          </div>
        ) : (
          items.map((it) => (
            <LineRow
              key={it.id}
              item={it}
              onQty={onQuantity}
              onRemove={onRemove}
              selectable={selectMode}
              selected={selectedIds.has(it.id)}
              onSelect={toggleSelect}
            />
          ))
        )}
      </div>

      <div className="shrink-0 bg-[var(--bg-glass)] p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <div className="mb-3 rounded-2xl border border-[var(--border)] bg-white/70 px-3 py-2.5">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={includeTip18}
              onChange={(e) => onToggleTip18?.(e.target.checked)}
              disabled={busy}
              className="h-4 w-4 shrink-0 accent-[var(--green2)]"
            />
            <span className="text-xs font-bold text-[var(--text)]">
              Incluir propina en total y ticket
            </span>
          </label>
          {includeTip18 && onTipPercentChange && (
            <div className="mt-2 flex items-center gap-2 border-t border-[var(--border)] pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text3)]">
                %
              </span>
              <select
                value={tipPercent}
                onChange={(e) => onTipPercentChange(Number(e.target.value))}
                disabled={busy}
                className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-xs font-bold text-[var(--text)]"
              >
                {tipOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}%
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-xs font-semibold text-[var(--text2)]">
            <span>Subtotal</span>
            <span className="font-mono">{formatMoney(subtotal)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-xs font-semibold text-[var(--text2)]">
              <span>Impuestos</span>
              <span className="font-mono">{formatMoney(tax)}</span>
            </div>
          )}
          {includeTip18 && (
            <div className="flex justify-between text-xs font-bold text-[var(--text)]">
              <span>Propina ({tipPercent}%)</span>
              <span className="font-mono">{formatMoney(tipAmount)}</span>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[var(--green-pale)] p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-[var(--green-dark)] uppercase tracking-wider">Total a Pagar</span>
            <span className="text-3xl font-black text-[var(--green)] font-mono tracking-tighter">
              {formatMoney(grandTotal ?? total + tipAmount)}
            </span>
          </div>
        </div>

        {canMove && !selectMode && (
          <div className="mb-3 flex gap-2">
            {onMoveItems && (
              <button
                type="button"
                disabled={!items.length || busy}
                onClick={() => setSelectMode(true)}
                className="app-no-drag min-h-[44px] flex-1 rounded-xl border border-[var(--border2)] text-sm font-bold text-[var(--text2)] transition hover:border-[var(--green)] hover:text-[var(--green)] disabled:opacity-40 active:scale-[0.98]"
              >
                ↗ Mover
              </button>
            )}
            {onMerge && (
              <button
                type="button"
                disabled={!items.length || busy}
                onClick={() => setMoveModal('merge')}
                className="app-no-drag min-h-[44px] flex-1 rounded-xl border border-[var(--border2)] text-sm font-bold text-[var(--text2)] transition hover:border-[var(--green)] hover:text-[var(--green)] disabled:opacity-40 active:scale-[0.98]"
              >
                ⊕ Unir Mesa
              </button>
            )}
          </div>
        )}

        {selectMode && (
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={exitSelectMode}
              className="app-no-drag min-h-[44px] flex-1 rounded-xl border border-[var(--border2)] text-sm font-bold text-[var(--text3)] transition hover:text-[var(--text2)] active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0 || busy}
              onClick={() => setMoveModal('move')}
              className="app-no-drag min-h-[44px] flex-[2] rounded-xl bg-[var(--green3)] text-sm font-black text-white transition hover:bg-[var(--green2)] disabled:opacity-40 active:scale-[0.98]"
            >
              Mover{' '}
              {selectedIds.size > 0
                ? `${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''}`
                : ''}
            </button>
          </div>
        )}

        <div className="grid grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            className="col-span-1 flex h-14 items-center justify-center rounded-xl bg-[var(--red-pale)] text-[var(--red)] transition-all hover:bg-[var(--red)] hover:text-white active:scale-95"
            title="Cancelar Orden"
          >
            <X className="h-6 w-6" />
          </button>
          
          <button
            type="button"
            onClick={() => onPrintPreBill?.()}
            disabled={!items.length || busy}
            className="col-span-1 flex h-14 items-center justify-center rounded-xl border-2 border-[var(--border)] text-[var(--text2)] transition-all hover:bg-[var(--bg3)] active:scale-95 disabled:opacity-30"
            title="Pre-cuenta"
          >
            <ReceiptText className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={onPay}
            disabled={!items.length || busy}
            className="btn-primary col-span-3 h-14 text-xl rounded-2xl active:scale-95 disabled:opacity-40"
          >
            💳 COBRAR
          </button>
        </div>
      </div>

      <OrderNoteModal
        open={noteOpen}
        initial={notes ?? ''}
        onClose={() => setNoteOpen(false)}
        onSave={onSaveNote}
      />

      <MoveTableModal
        open={moveModal !== null}
        mode={moveModal ?? 'move'}
        selectedCount={selectedIds.size}
        tables={tables.filter((t) => t.id !== currentTableId)}
        openOrderTableIds={openOrderTableIds}
        onSelect={(tableId) => void handleTablePick(tableId)}
        onClose={() => setMoveModal(null)}
      />

      {cancelOpen && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onClick={() => setCancelOpen(false)}>
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-[var(--text)]">¿Cancelar Orden?</h3>
            <p className="mt-2 text-sm font-medium text-[var(--text2)]">
              Se eliminarán todos los ítems de {title}. Esta acción no se puede deshacer.
            </p>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl py-3 text-sm font-bold text-[var(--text3)] transition hover:bg-[var(--bg3)]"
                onClick={() => setCancelOpen(false)}
              >
                Volver
              </button>
              <button
                type="button"
                className="flex-[2] rounded-xl bg-[var(--red)] py-3 text-sm font-black text-white shadow-lg shadow-[var(--red)]/20 transition hover:brightness-110"
                onClick={() => {
                  setCancelOpen(false);
                  void onCancelOrder();
                }}
              >
                Sí, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
