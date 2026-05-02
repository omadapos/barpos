import type { Category } from '@/types';

type Props = {
  categories: Category[];
  activeCategory: Category | null;
  onSelect: (c: Category) => void;
};

export default function CategoryGrid({ categories, activeCategory, onSelect }: Props) {
  return (
    <div className="-mx-1 overflow-x-auto overflow-y-hidden scrollbar-emerald px-1 pb-1">
      <div className="flex w-max min-w-full gap-2 pb-1">
        {categories.map((c) => {
          const active = activeCategory?.id === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className={`app-no-drag flex min-h-[72px] w-[118px] shrink-0 flex-col items-center justify-center gap-1 rounded-[var(--radius)] border-2 px-3 py-2 text-center shadow-sm transition active:scale-[0.98] ${
                active
                  ? 'border-[var(--green2)] bg-[var(--green-dim)] shadow-[0_0_16px_rgba(16,185,129,0.12)]'
                  : 'border-[var(--border)] bg-[var(--bg3)] hover:border-[var(--border2)]'
              }`}
              style={
                active
                  ? undefined
                  : { backgroundColor: c.color ? `${c.color}33` : 'var(--bg3)' }
              }
            >
              <span className="text-[22px] leading-none">{c.icon}</span>
              <span className="max-w-[100px] truncate text-[9px] font-bold uppercase tracking-wide text-[var(--text)]">
                {c.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
