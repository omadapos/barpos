import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, Wallet, X } from 'lucide-react';
import { formatMoney } from '@/lib/format';

type Props = {
  open: boolean;
  total: number;
  tableLabel?: string;
  onClose: () => void;
  onConfirm: (method: 'cash' | 'card') => Promise<void>;
};

function formatDisplayAmount(amountStr: string): string {
  const n = parseInt(amountStr || '0', 10);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(safe);
}

export default function PaymentModal({
  open,
  total,
  tableLabel,
  onClose,
  onConfirm,
}: Props) {
  const [method, setMethod] = useState<'cash' | 'card' | null>(null);
  const [amountStr, setAmountStr] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        if (method) setMethod(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, method]);

  useEffect(() => {
    if (!open) {
      setMethod(null);
      setAmountStr('0');
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const totalNum = Number(total) || 0;
  const totalInt = Math.ceil(totalNum);
  const amountNumber = parseInt(amountStr || '0', 10) || 0;
  const change = amountNumber - totalInt;

  const handleKey = (key: string) => {
    setAmountStr((prev) => {
      if (key === 'back') {
        const next = prev.slice(0, -1);
        return next === '' ? '0' : next;
      }
      if (key === '00') {
        if (prev === '0') return '0';
        const next = prev + '00';
        return next.length > 7 ? prev : next;
      }
      if (prev === '0') return key;
      const next = prev + key;
      return next.length > 7 ? prev : next;
    });
  };

  const setAmount = (value: number) => {
    setAmountStr(String(Math.min(Math.max(0, Math.round(value)), 9_999_999)));
  };

  const addQuick = (delta: number) => {
    setAmountStr((prev) => {
      const n = (parseInt(prev || '0', 10) || 0) + delta;
      return String(Math.min(Math.max(0, n), 9_999_999));
    });
  };

  const confirm = async (m: 'cash' | 'card') => {
    setSubmitting(true);
    try {
      await onConfirm(m);
    } finally {
      setSubmitting(false);
    }
  };

  const cashOk = amountNumber >= totalInt;
  const numpadBtn =
    'flex h-14 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-xl font-black text-[var(--text)] shadow-sm shadow-black/5 transition-all hover:bg-[var(--green-pale)] active:scale-90';

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--text)]">
              Finalizar Pago
            </h2>
            <p className="text-sm font-bold uppercase tracking-widest text-[var(--text3)]">
              {tableLabel || 'Caja Rapida'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[var(--bg3)] p-2 text-[var(--text2)] transition hover:bg-[var(--bg4)]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-5 rounded-3xl bg-[var(--green-pale)] p-5 text-center">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--green-dark)] opacity-60">
            Total a cobrar
          </span>
          <div className="font-mono text-4xl font-black text-[var(--green)]">
            {formatMoney(totalNum)}
          </div>
        </div>

        {!method && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMethod('cash')}
              className="group flex h-20 items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--green-pale)]/60 px-5 transition-all hover:border-[var(--green)] hover:bg-[var(--green-pale)] active:scale-95"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[var(--green)] shadow-sm">
                  <Wallet className="h-6 w-6" />
                </div>
                <span className="text-lg font-black text-[var(--text)]">Efectivo</span>
              </div>
              <div className="h-8 w-8 rounded-full border-2 border-[var(--border)] transition-colors group-hover:border-[var(--green)]" />
            </button>
            <button
              type="button"
              onClick={() => setMethod('card')}
              className="group flex h-20 items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg3)] px-5 transition-all hover:border-[var(--green)] hover:bg-[var(--green-pale)] active:scale-95"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[var(--green)] shadow-sm">
                  <CreditCard className="h-6 w-6" />
                </div>
                <span className="text-lg font-black text-[var(--text)]">Tarjeta / Link</span>
              </div>
              <div className="h-8 w-8 rounded-full border-2 border-[var(--border)] transition-colors group-hover:border-[var(--green)]" />
            </button>
          </div>
        )}

        {method === 'card' && (
          <div className="space-y-5">
            <div className="flex items-center gap-5 rounded-3xl border border-[var(--border)] bg-[var(--green-pale)]/60 p-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--green)] shadow-sm">
                <CreditCard className="h-9 w-9" />
              </div>
              <p className="text-sm font-bold text-[var(--text2)]">
                Procesa el pago en la terminal bancaria por{' '}
                <span className="text-[var(--text)]">{formatMoney(totalNum)}</span>.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
              <button
                type="button"
                onClick={() => setMethod(null)}
                className="min-h-[52px] rounded-2xl border border-[var(--border)] bg-white text-sm font-black uppercase tracking-widest text-[var(--text3)] transition hover:bg-[var(--bg3)]"
              >
                Cambiar
              </button>
              <button
                type="button"
                onClick={() => void confirm('card')}
                disabled={submitting}
                className="btn-primary min-h-[52px] rounded-2xl text-lg active:scale-95 disabled:opacity-40"
              >
                <CheckCircle2 className="mr-2 h-6 w-6" /> Confirmar pago
              </button>
            </div>
          </div>
        )}

        {method === 'cash' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setMethod(null)}
                className="p-2 text-[var(--text3)] transition hover:text-[var(--text)]"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex-1 rounded-2xl bg-[var(--bg3)] p-3 text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text3)]">
                  Recibido
                </span>
                <div className="font-mono text-2xl font-black text-[var(--text)]">
                  {formatDisplayAmount(amountStr)}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_260px]">
              <div className="space-y-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--green-pale)]/70 p-4">
                  <span className="mb-3 block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--green-dark)]/70">
                    Recibido rapido
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAmount(totalInt)}
                      className="min-h-[62px] rounded-2xl bg-[var(--green3)] px-2 text-base font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-[var(--green2)] active:scale-95"
                    >
                      Exacto
                    </button>
                    {[5, 10, 20, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => addQuick(val)}
                        className="min-h-[62px] rounded-2xl border border-white/70 bg-white/85 px-2 text-2xl font-black text-[var(--green)] shadow-sm transition hover:bg-white active:scale-95"
                      >
                        +${val}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={`rounded-2xl p-4 text-center transition-all ${
                    change >= 0
                      ? 'border-2 border-[var(--green)]/20 bg-[var(--green-pale)]'
                      : 'bg-[var(--red-pale)]'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                    {change >= 0 ? 'Vuelto a entregar' : 'Monto faltante'}
                  </span>
                  <div
                    className={`font-mono text-3xl font-black ${
                      change >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'
                    }`}
                  >
                    {formatMoney(Math.abs(change))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', 'back'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => (k === 'back' ? handleKey('back') : handleKey(k))}
                    className={`${numpadBtn} ${k === 'back' ? 'text-[var(--red)]' : ''}`}
                  >
                    {k === 'back' ? '⌫' : k}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void confirm('cash')}
              disabled={!cashOk || submitting}
              className="btn-primary min-h-[54px] w-full rounded-2xl text-xl active:scale-95 disabled:opacity-40 disabled:grayscale"
            >
              <CheckCircle2 className="mr-2 h-6 w-6" /> Finalizar venta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
