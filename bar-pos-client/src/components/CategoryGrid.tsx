import type { Category } from '@/types';

type Props = {
  categories: Category[];
  activeCategory: Category | null;
  onSelect: (c: Category) => void;
};

export default function CategoryGrid({ categories, activeCategory, onSelect }: Props) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg3)]/30 border-l border-r border-[var(--border)] overflow-hidden">
      <div className="shrink-0 px-4 py-4 border-b border-[var(--border)] bg-white/40">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text3)] opacity-60">Categorías</span>
      </div>
      
      {/* Scroll independiente para las categorías */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-none">
        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => {
            const active = activeCategory?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c)}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-3 text-center transition-all duration-200 active:scale-90 min-h-[90px] ${
                  active
                    ? 'bg-white text-[var(--green)] shadow-md shadow-black/5 border-2 border-[var(--green)]'
                    : 'text-[var(--text2)] bg-white/20 hover:bg-white/60 border border-transparent'
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
