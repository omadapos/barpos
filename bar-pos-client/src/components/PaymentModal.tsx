import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
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

  const resetAmount = useCallback(() => setAmountStr('0'), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setMethod(null);
        resetAmount();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, resetAmount]);

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
        if (next.length > 7) return prev;
        return next;
      }
      if (prev === '0') return key;
      const next = prev + key;
      if (next.length > 7) return prev;
      return next;
    });
  };

  const addQuick = (delta: number) => {
    setAmountStr((prev) => {
      const n = (parseInt(prev || '0', 10) || 0) + delta;
      const capped = Math.min(Math.max(0, n), 9_999_999);
      return String(capped);
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

  const exactPay = async () => {
    setSubmitting(true);
    try {
      await onConfirm('cash');
    } finally {
      setSubmitting(false);
    }
  };

  const cashOk = amountNumber >= totalInt;
  const numpadBtn =
    'flex min-h-[54px] min-w-0 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] text-lg font-bold text-[var(--text)] transition hover:border-[var(--border2)] hover:bg-[var(--bg4)] active:scale-[0.95]';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px] app-no-drag"
      onClick={() => {
        setMethod(null);
        resetAmount();
        onClose();
      }}
    >
      <div
        className="modal-enter w-[300px] max-w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg2)] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">
              Cobro{tableLabel ? ` — ${tableLabel}` : ''}
            </h2>
            <p className="mt-1 text-sm text-[var(--text3)]">
              TOTAL:{' '}
              <span className="font-bold text-[var(--green)]">{formatMoney(totalNum)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setMethod(null);
              resetAmount();
              onClose();
            }}
            className="rounded-lg p-1.5 text-[var(--text2)] hover:bg-[var(--bg3)]"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {!method && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="min-h-[80px] rounded-[var(--radius)] bg-[var(--amber)] text-base font-bold text-[#1a1204] transition hover:brightness-110 active:scale-[0.97]"
              onClick={() => {
                setMethod('cash');
                resetAmount();
              }}
            >
              💵 EFECTIVO
            </button>
            <button
              type="button"
              className="min-h-[80px] rounded-[var(--radius)] border border-[var(--blue)]/40 bg-[var(--bg3)] text-base font-bold text-[var(--blue)] transition hover:bg-[var(--bg4)] active:scale-[0.97]"
              onClick={() => setMethod('card')}
            >
              💳 TARJETA
            </button>
          </div>
        )}

        {method === 'card' && (
          <div className="space-y-3">
            <p className="text-center text-sm text-[var(--text2)]">
              Pago con tarjeta — {formatMoney(totalNum)}
            </p>
            <button
              type="button"
              disabled={submitting}
              className="min-h-[52px] w-full rounded-[var(--radius)] bg-[var(--green2)] text-base font-bold text-white transition hover:bg-[var(--green)] disabled:opacity-40"
              onClick={() => void confirm('card')}
            >
              ✓ CONFIRMAR PAGO
            </button>
            <button
              type="button"
              className="min-h-[48px] w-full rounded-[var(--radius)] border border-[var(--border2)] text-[var(--text3)] hover:border-[var(--green)] hover:text-[var(--text2)]"
              onClick={() => setMethod(null)}
              disabled={submitting}
            >
              Volver
            </button>
          </div>
        )}

        {method === 'cash' && (
          <div className="space-y-3">
            <div className="rounded-[var(--radius-lg)] border border-[var(--border2)] bg-[var(--bg3)] px-3 py-3 text-center transition-colors">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
                Monto recibido
              </div>
              <div className="text-2xl font-bold text-[var(--green)]">
                {formatDisplayAmount(amountStr)}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void exactPay()}
                className="rounded-full border border-[var(--green2)] px-2 py-1.5 text-[11px] font-semibold text-[var(--green)] transition hover:bg-[var(--green-dim)]"
              >
                Exacto {formatMoney(totalInt)}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => addQuick(500)}
                className="rounded-full border border-[var(--green2)] px-2 py-1.5 text-[11px] font-semibold text-[var(--green)] transition hover:bg-[var(--green-dim)]"
              >
                +$500
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => addQuick(1000)}
                className="rounded-full border border-[var(--green2)] px-2 py-1.5 text-[11px] font-semibold text-[var(--green)] transition hover:bg-[var(--green-dim)]"
              >
                +$1,000
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => addQuick(2000)}
                className="rounded-full border border-[var(--green2)] px-2 py-1.5 text-[11px] font-semibold text-[var(--green)] transition hover:bg-[var(--green-dim)]"
              >
                +$2,000
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={submitting}
                  className={numpadBtn}
                  onClick={() => handleKey(d)}
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                disabled={submitting}
                className={`${numpadBtn} text-[var(--red)]`}
                onClick={() => handleKey('back')}
              >
                ⌫
              </button>
              <button
                type="button"
                disabled={submitting}
                className={numpadBtn}
                onClick={() => handleKey('0')}
              >
                0
              </button>
              <button
                type="button"
                disabled={submitting}
                className={`${numpadBtn} text-[var(--text2)]`}
                onClick={() => handleKey('00')}
              >
                00
              </button>
            </div>

            <div
              className={`rounded-[var(--radius-lg)] border px-3 py-2.5 text-center text-sm font-semibold transition-colors ${
                change >= 0
                  ? 'border-[var(--border2)] bg-[var(--green-pale)] text-[var(--green)]'
                  : 'border-[var(--red)]/60 bg-[var(--red-pale)] text-[var(--red)]'
              }`}
            >
              {change >= 0 ? (
                <>CAMBIO: {formatMoney(change)}</>
              ) : (
                <>Faltan {formatMoney(Math.abs(change))}</>
              )}
            </div>

            <button
              type="button"
              disabled={!cashOk || submitting}
              className="min-h-[52px] w-full rounded-[var(--radius)] bg-[var(--green2)] text-base font-bold text-white transition hover:bg-[var(--green)] disabled:opacity-40"
              onClick={() => void confirm('cash')}
            >
              ✓ CONFIRMAR PAGO
            </button>
            <button
              type="button"
              className="min-h-[48px] w-full rounded-[var(--radius)] border border-[var(--border2)] text-[var(--text3)] hover:border-[var(--green)] hover:text-[var(--text2)]"
              onClick={() => {
                setMethod(null);
                resetAmount();
              }}
              disabled={submitting}
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
