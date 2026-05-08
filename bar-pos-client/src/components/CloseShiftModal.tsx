import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { useShiftStore } from '@/store/useShiftStore';

type Props = {
  open: boolean;
  onClose: () => void;
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function CloseShiftModal({ open, onClose }: Props) {
  const summary = useShiftStore((s) => s.summary);
  const loadSummary = useShiftStore((s) => s.loadSummary);
  const closeShift = useShiftStore((s) => s.closeShift);
  const [closingCash, setClosingCash] = useState('0');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) void loadSummary();
  }, [open, loadSummary]);

  if (!open) return null;

  const totalSales = num(summary?.totalSales ?? summary?.totalSold ?? summary?.total);
  const orders = num(summary?.orderCount ?? summary?.totalOrders);
  const tips = num(summary?.tips ?? summary?.totalTips);

  const submit = async () => {
    const amount = Number(closingCash);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error('Efectivo final invalido');
      return;
    }
    setBusy(true);
    try {
      await closeShift(amount, notes);
      toast.success('Turno cerrado');
      onClose();
    } catch {
      toast.error('No se pudo cerrar el turno');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
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

        <div className="mb-5 grid grid-cols-3 gap-3">
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
          disabled={busy}
          onClick={() => void submit()}
          className="h-12 w-full rounded-xl bg-[var(--red)] font-black text-white disabled:opacity-50"
        >
          {busy ? 'Cerrando...' : 'Confirmar cierre'}
        </button>
      </div>
    </div>
  );
}
