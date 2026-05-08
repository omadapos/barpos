import { useState } from 'react';
import toast from 'react-hot-toast';
import { DollarSign } from 'lucide-react';
import { useShiftStore } from '@/store/useShiftStore';

type Props = {
  open: boolean;
};

export default function OpenShiftModal({ open }: Props) {
  const openShift = useShiftStore((s) => s.openShift);
  const [openingCash, setOpeningCash] = useState('0');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    const amount = Number(openingCash);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error('Efectivo inicial invalido');
      return;
    }
    setBusy(true);
    try {
      await openShift(amount);
      toast.success('Turno abierto');
    } catch {
      toast.error('No se pudo abrir el turno');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--green-pale)] text-[var(--green)]">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--text)]">Abrir Turno</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text3)]">
              Requerido para operar
            </p>
          </div>
        </div>

        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[var(--text2)]">
          Efectivo inicial
        </label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={openingCash}
          onChange={(e) => setOpeningCash(e.target.value)}
          disabled={busy}
          className="mb-6 h-14 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-2xl font-black text-[var(--text)] outline-none focus:border-[var(--green)]"
        />

        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="btn-primary h-14 w-full rounded-xl text-base disabled:opacity-50"
        >
          {busy ? 'Abriendo...' : 'Abrir turno'}
        </button>
      </div>
    </div>
  );
}
