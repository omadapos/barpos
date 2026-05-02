import React from 'react';

export default function CategoryGrid({ categories, activeCategory, onSelect }) {
  return (
    <div className="flex flex-wrap gap-3">
      {(categories || []).map((c) => {
        const active = activeCategory?.id === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className={`flex min-h-[80px] min-w-[120px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-4 py-3 text-center font-semibold shadow-md transition ${
              active
                ? 'border-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950'
                : 'border-transparent hover:brightness-110'
            }`}
            style={{ backgroundColor: c.color || '#6366f1' }}
          >
            <span className="text-2xl leading-none">{c.icon}</span>
            <span className="text-sm text-white drop-shadow">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
