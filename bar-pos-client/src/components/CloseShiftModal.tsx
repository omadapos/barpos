import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { useOrderStore } from '@/store/useOrderStore';
import { useShiftStore } from '@/store/useShiftStore';
import { useTableStore } from '@/store/useTableStore';

type Props = {
  open: boolean;
  onClose: () => void;
  onClosed?: () => void;
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function CloseShiftModal({ open, onClose, onClosed }: Props) {
  const currentShift = useShiftStore((s) => s.currentShift);
  const summary = useShiftStore((s) => s.summary);
  const loadSummary = useShiftStore((s) => s.loadSummary);
  const closeShift = useShiftStore((s) => s.closeShift);
  const setCurrentOrder = useOrderStore((s) => s.setCurrentOrder);
  const openOrders = useTableStore((s) => s.openOrders);
  const refreshTables = useTableStore((s) => s.refresh);
  const [closingCash, setClosingCash] = useState('0');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirmClose(false);
    void loadSummary();
    void refreshTables();
  }, [open, loadSummary, refreshTables]);

  if (!open) return null;

  const totalSales = num(summary?.totalSales ?? summary?.totalSold ?? summary?.total);
  const cashSales = num(
    summary?.cashSales ?? summary?.totalCash ?? summary?.cashTotal ?? summary?.salesCash
  );
  const cardSales = num(
    summary?.cardSales ?? summary?.totalCard ?? summary?.cardTotal ?? summary?.salesCard
  );
  const orders = num(summary?.orderCount ?? summary?.totalOrders);
  const tips = num(summary?.tips ?? summary?.totalTips);
  const openingCash = num(currentShift?.openingCash);
  const countedCash = num(closingCash);
  const expectedCash = openingCash + cashSales;
  const cashDifference = countedCash - expectedCash;
  const openOrderCount = Object.keys(openOrders).length;
  const hasOpenOrders = openOrderCount > 0;

  const submit = async () => {
    if (hasOpenOrders) {
      toast.error('No puedes cerrar turno con ordenes abiertas');
      return;
    }
    if (!confirmClose) {
      setConfirmClose(true);
      return;
    }
    const amount = Number(closingCash);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error('Efectivo final invalido');
      return;
    }
    setBusy(true);
    try {
      await closeShift(amount, notes);
      setCurrentOrder(null);
      await refreshTables();
      toast.success('Turno cerrado');
      onClosed?.();
      onClose();
    } catch {
      toast.error('No se pudo cerrar el turno');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl scrollbar-none">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[var(--text)]">Cerrar Turno</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text3)]">
              Resumen actual
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--text3)] hover:bg-[var(--bg3)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {hasOpenOrders && (
          <div className="mb-5 rounded-xl border border-[var(--red)]/30 bg-[var(--red-pale)] p-3 text-sm font-bold text-[var(--red)]">
            Hay {openOrderCount} orden{openOrderCount === 1 ? '' : 'es'} abierta
            {openOrderCount === 1 ? '' : 's'}. Debes cobrarlas o cancelarlas antes de cerrar turno.
          </div>
        )}

        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[var(--bg)] p-3">
            <div className="text-[10px] font-black uppercase text-[var(--text3)]">Vendido</div>
            <div className="text-lg font-black text-[var(--text)]">{formatMoney(totalSales)}</div>
          </div>
          <div className="rounded-xl bg-[var(--bg)] p-3">
            <div className="text-[10px] font-black uppercase text-[var(--text3)]">Ordenes</div>
            <div className="text-lg font-black text-[var(--text)]">{orders}</div>
          </div>
          <div className="rounded-xl bg-[var(--bg)] p-3">
            <div className="text-[10px] font-black uppercase text-[var(--text3)]">Propinas</div>
            <div className="text-lg font-black text-[var(--text)]">{formatMoney(tips)}</div>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
          <div className="mb-3 text-[10px] font-black uppercase tracking-wider text-[var(--text3)]">
            Cuadre de caja
          </div>
          <div className="space-y-2 text-sm font-bold">
            <div className="flex justify-between text-[var(--text2)]">
              <span>Efectivo inicial</span>
              <span className="font-mono">{formatMoney(openingCash)}</span>
            </div>
            <div className="flex justify-between text-[var(--text2)]">
              <span>Ventas efectivo</span>
              <span className="font-mono">{formatMoney(cashSales)}</span>
            </div>
            <div className="flex justify-between text-[var(--text2)]">
              <span>Ventas tarjeta</span>
              <span className="font-mono">{formatMoney(cardSales)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2 text-[var(--text)]">
              <span>Efectivo esperado</span>
              <span className="font-mono">{formatMoney(expectedCash)}</span>
            </div>
            <div
              className={`flex justify-between text-base ${
                cashDifference < 0
                  ? 'text-[var(--red)]'
                  : cashDifference > 0
                    ? 'text-[var(--green)]'
                    : 'text-[var(--text)]'
              }`}
            >
              <span>Diferencia</span>
              <span className="font-mono">{formatMoney(cashDifference)}</span>
            </div>
          </div>
        </div>

        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[var(--text2)]">
          Efectivo final
        </label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={closingCash}
          onChange={(e) => setClosingCash(e.target.value)}
          disabled={busy}
          className="mb-3 h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 font-black text-[var(--text)] outline-none focus:border-[var(--green)]"
        />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={busy}
          placeholder="Notas del cierre"
          className="mb-5 min-h-20 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--green)]"
        />

        <button
          type="button"
          disabled={busy || hasOpenOrders}
          onClick={() => void submit()}
          className="h-12 w-full rounded-xl bg-[var(--red)] font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy
            ? 'Cerrando...'
            : confirmClose
              ? 'Si, cerrar turno definitivamente'
              : 'Confirmar cierre'}
        </button>
        {confirmClose && !hasOpenOrders && (
          <p className="mt-3 text-center text-xs font-bold text-[var(--red)]">
            Esta accion cierra la caja actual. Para vender de nuevo tendras que abrir otro turno.
          </p>
        )}
      </div>
    </div>
  );
}
