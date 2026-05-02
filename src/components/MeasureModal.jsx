import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { formatMoney } from '@/lib/format';

const measureEmoji = {
  Trago: '🥃',
  Cuarto: '🥃',
  Media: '🍾',
  Litro: '🍾',
};

export default function MeasureModal({ product, open, onClose, onSelectMeasure }) {
  const [measures, setMeasures] = useState([]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!open || !product?.id) {
        setMeasures([]);
        return;
      }
      const list = await window.electronAPI.getMeasures(product.id);
      if (!cancelled) setMeasures(list || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, product]);

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-600 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-white">{product.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-800"
            aria-label="Cerrar"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {measures.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMeasure(m)}
              className="flex min-h-[120px] min-w-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-violet-500/40 bg-violet-950/80 py-6 text-xl font-bold text-white shadow-lg hover:border-violet-400 hover:bg-violet-900/80"
            >
              <span className="text-4xl">{measureEmoji[m.measure_name] || '🥃'}</span>
              <span>{m.measure_name}</span>
              <span className="text-2xl text-emerald-400">{formatMoney(m.price)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
