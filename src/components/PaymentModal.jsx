import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { formatMoney } from '@/lib/format';

export default function PaymentModal({
  open,
  total,
  onClose,
  onConfirm,
}) {
  const [method, setMethod] = useState(null);
  const [tendered, setTendered] = useState('');

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) {
        setMethod(null);
        setTendered('');
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setMethod(null);
      setTendered('');
    }
  }, [open]);

  if (!open) return null;

  const totalNum = Number(total) || 0;
  const tenderedNum = parseFloat(String(tendered).replace(/,/g, '')) || 0;
  const change = Math.max(0, tenderedNum - totalNum);

  const confirm = () => {
    if (method === 'cash') {
      if (tenderedNum < totalNum) return;
    }
    if (method) onConfirm(method, { tendered: tenderedNum, change });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Cobrar</h2>
          <button
            type="button"
            onClick={() => {
              setMethod(null);
              onClose();
            }}
            className="rounded-lg p-2 hover:bg-slate-800"
            aria-label="Cerrar"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        <p className="mb-6 text-center text-3xl font-bold text-emerald-400">
          {formatMoney(totalNum)}
        </p>

        {!method && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              className="min-h-[80px] rounded-2xl bg-amber-700 text-xl font-bold hover:bg-amber-600"
              onClick={() => setMethod('cash')}
            >
              💵 Efectivo
            </button>
            <button
              type="button"
              className="min-h-[80px] rounded-2xl bg-indigo-700 text-xl font-bold hover:bg-indigo-600"
              onClick={() => setMethod('card')}
            >
              💳 Tarjeta
            </button>
          </div>
        )}

        {method === 'cash' && (
          <div className="space-y-4">
            <label className="block text-sm text-slate-400">Monto recibido</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="min-h-[52px] w-full rounded-xl border border-slate-600 bg-slate-800 px-4 text-2xl"
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              placeholder="0.00"
            />
            <div className="text-lg">
              Cambio: <span className="font-bold text-emerald-400">{formatMoney(change)}</span>
            </div>
            <button
              type="button"
              disabled={tenderedNum < totalNum}
              className="min-h-[52px] w-full rounded-xl bg-emerald-600 text-lg font-bold hover:bg-emerald-500 disabled:opacity-40"
              onClick={confirm}
            >
              Confirmar cobro
            </button>
            <button
              type="button"
              className="min-h-[48px] w-full rounded-xl bg-slate-700 hover:bg-slate-600"
              onClick={() => setMethod(null)}
            >
              Volver
            </button>
          </div>
        )}

        {method === 'card' && (
          <div className="space-y-4">
            <p className="text-center text-slate-300">Cobro con tarjeta por el total indicado.</p>
            <button
              type="button"
              className="min-h-[52px] w-full rounded-xl bg-emerald-600 text-lg font-bold hover:bg-emerald-500"
              onClick={confirm}
            >
              Confirmar cobro
            </button>
            <button
              type="button"
              className="min-h-[48px] w-full rounded-xl bg-slate-700 hover:bg-slate-600"
              onClick={() => setMethod(null)}
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
