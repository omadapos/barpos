import React from 'react';
import { formatMoney } from '@/lib/format';

export default function ProductGrid({ products, onProduct, isBottleCategory }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
      {(products || []).map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onProduct(p)}
          className="flex min-h-[80px] min-w-[140px] flex-col items-center justify-center gap-1 rounded-xl border border-slate-600 bg-slate-800 px-3 py-4 text-center shadow hover:border-indigo-500 hover:bg-slate-700"
        >
          <span className="text-base font-semibold leading-tight text-white">{p.name}</span>
          <span className="text-lg font-bold text-emerald-400">
            {isBottleCategory ? 'Medidas' : formatMoney(p.price)}
          </span>
        </button>
      ))}
    </div>
  );
}
