import { useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Minus, Plus, X } from 'lucide-react';
import type { OrderItem } from '@/types';
import { formatMoney } from '@/lib/format';
import OrderNoteModal from '@/components/OrderNoteModal';

function useElapsedLabel(createdAt: string) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const tick = () => {
      const ms = Date.now() - new Date(createdAt).getTime();
      const min = Math.floor(ms / 60_000);
      if (min < 1) setLabel('hace un momento');
      else if (min < 60) setLabel(`hace ${min} min`);
      else {
        const h = Math.floor(min / 60);
        const m = min % 60;
        setLabel(m ? `hace ${h}h ${m}min` : `hace ${h}h`);
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
}: {
  item: OrderItem;
  onQty: (id: number, q: number) => void;
  onRemove: (id: number) => void;
}) {
  const startX = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [hover, setHover] = useState(false);

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
      className="group/line item-enter relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className="flex flex-col gap-2 p-3 transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
      >
        <div className="flex justify-between gap-2">
          <div className="min-w-0">
            <span className="font-semibold text-[var(--text)]">{item.productName}</span>
            {item.measureName ? (
              <div className="text-xs text-[var(--text3)]">{item.measureName}</div>
            ) : null}
          </div>
          <button
            type="button"
            className={`app-no-drag shrink-0 rounded-lg p-1.5 transition sm:opacity-0 sm:group-hover/line:opacity-100 ${
              hover ? 'bg-[var(--red)]/20 text-[var(--red)] opacity-100' : 'text-[var(--red)]/50 opacity-60'
            }`}
            onClick={() => onRemove(item.id)}
            aria-label="Quitar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--text2)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="app-no-drag flex h-11 min-w-[44px] items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg2)] font-bold hover:bg-[var(--bg4)] active:scale-95"
              onClick={() => onQty(item.id, item.quantity - 1)}
            >
              <Minus className="h-5 w-5" />
            </button>
            <span className="min-w-[2rem] text-center text-lg font-bold text-[var(--text)]">
              {item.quantity}
            </span>
            <button
              type="button"
              className="app-no-drag flex h-11 min-w-[44px] items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg2)] font-bold hover:bg-[var(--bg4)] active:scale-95"
              onClick={() => onQty(item.id, item.quantity + 1)}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <span className="font-bold text-[var(--green)]">{formatMoney(item.subtotal)}</span>
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
  /** Imprimir pre-cuenta (térmica por IP / configuración guardada) */
  onPrintPreBill?: () => void | Promise<void>;
  /** Propina opcional 18 % sobre el total de la cuenta */
  includeTip18?: boolean;
  onToggleTip18?: (next: boolean) => void;
  tipAmount?: number;
  /** Total + propina si aplica */
  grandTotal?: number;
  onSaveNote: (note: string) => Promise<void>;
  busy?: boolean;
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
  tipAmount = 0,
  grandTotal,
  onSaveNote,
  busy,
}: Props) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const elapsed = useElapsedLabel(createdAt);
  const started = format(new Date(createdAt), 'h:mm a', { locale: es });

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-[var(--border)] bg-[var(--bg2)]">
      <div className="shrink-0 space-y-2 border-b border-[var(--border)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[var(--text)]">{title}</h2>
          <span className="rounded-full border border-[var(--green2)] bg-[var(--green-dim)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--green)]">
            ABIERTA
          </span>
        </div>
        <p className="text-xs text-[var(--text3)]">
          Iniciada {started}
          {elapsed ? ` · ${elapsed}` : ''}
        </p>
        {notes ? (
          <p className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] px-2 py-1.5 text-xs text-[var(--text2)]">
            📝 {notes}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setNoteOpen(true)}
          disabled={busy}
          className="app-no-drag rounded-[var(--radius)] border border-[var(--border2)] px-2 py-1.5 text-xs font-semibold text-[var(--text3)] hover:border-[var(--green)] hover:text-[var(--green)] disabled:opacity-50"
        >
          📝 Nota
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 scrollbar-emerald">
        {items.length === 0 && (
          <p className="text-center text-sm text-[var(--text3)]">Sin artículos aún</p>
        )}
        {items.map((it) => (
          <LineRow key={it.id} item={it} onQty={onQuantity} onRemove={onRemove} />
        ))}
      </div>

      <div className="sticky bottom-0 shrink-0 border-t border-[var(--border)] bg-[var(--bg)] px-4 py-4">
        <div className="mb-2 flex justify-between text-sm text-[var(--text2)]">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        {tax > 0 && (
          <div className="mb-2 flex justify-between text-sm text-[var(--text2)]">
            <span>Impuesto</span>
            <span>{formatMoney(tax)}</span>
          </div>
        )}
        {onToggleTip18 ? (
          <button
            type="button"
            onClick={() => onToggleTip18(!includeTip18)}
            disabled={busy}
            className={`app-no-drag mb-3 min-h-[44px] w-full rounded-[var(--radius)] border-2 px-3 text-sm font-bold transition disabled:opacity-40 active:scale-[0.98] ${
              includeTip18
                ? 'border-[var(--green2)] bg-[var(--green-dim)] text-[var(--green)]'
                : 'border-[var(--border2)] text-[var(--text2)] hover:border-[var(--amber)]/60 hover:text-[var(--text)]'
            }`}
          >
            {includeTip18 ? '✓ Propina 18% incluida' : 'Agregar propina 18%'}
          </button>
        ) : null}
        {includeTip18 ? (
          <>
            <div className="mb-2 flex justify-between text-sm text-[var(--text2)]">
              <span>Total cuenta</span>
              <span>{formatMoney(total)}</span>
            </div>
            <div className="mb-2 flex justify-between text-sm font-semibold text-[var(--text)]">
              <span>Propina (18%)</span>
              <span>{formatMoney(tipAmount)}</span>
            </div>
            <div className="mb-4 flex justify-between text-2xl font-bold text-[var(--green)]">
              <span>A PAGAR</span>
              <span>{formatMoney(grandTotal ?? total + tipAmount)}</span>
            </div>
          </>
        ) : (
          <div className="mb-4 flex justify-between text-2xl font-bold text-[var(--green)]">
            <span>TOTAL</span>
            <span>{formatMoney(total)}</span>
          </div>
        )}
        {onPrintPreBill ? (
          <button
            type="button"
            onClick={() => void onPrintPreBill()}
            disabled={!items.length || busy}
            className="app-no-drag mb-3 min-h-[48px] w-full rounded-[var(--radius)] border border-[var(--border2)] text-sm font-bold text-[var(--text2)] transition hover:border-[var(--green)] hover:text-[var(--green)] disabled:opacity-40 active:scale-[0.98]"
          >
            🖨 Pre-cuenta
          </button>
        ) : null}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            disabled={busy}
            className="app-no-drag min-h-[52px] flex-1 rounded-[var(--radius)] border border-[var(--border2)] text-base font-semibold text-[var(--text3)] transition hover:border-[var(--red)]/50 hover:text-[var(--red)] disabled:opacity-50 active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onPay}
            disabled={!items.length || busy}
            className="app-no-drag min-h-[52px] flex-[2] rounded-[var(--radius)] bg-[var(--green3)] text-base font-bold text-white transition hover:bg-[var(--green2)] disabled:opacity-40 active:scale-[0.98]"
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

      {cancelOpen && (
        <div
          className="fixed inset-0 z-[125] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px] app-no-drag"
          onClick={() => setCancelOpen(false)}
        >
          <div
            className="modal-enter w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg2)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[var(--text)]">¿Cancelar esta orden?</h3>
            <p className="mt-2 text-sm text-[var(--text2)]">
              {title} — {formatMoney(total)} — {items.length} ítem{items.length !== 1 ? 's' : ''}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="min-h-[48px] flex-1 rounded-[var(--radius)] border border-[var(--border2)] text-[var(--text3)] hover:border-[var(--green)] hover:text-[var(--text2)]"
                onClick={() => setCancelOpen(false)}
              >
                Volver
              </button>
              <button
                type="button"
                className="min-h-[48px] flex-[2] rounded-[var(--radius)] bg-[var(--red)]/90 font-bold text-white hover:bg-[var(--red)] disabled:opacity-50"
                disabled={busy}
                onClick={() => {
                  setCancelOpen(false);
                  void onCancelOrder();
                }}
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
