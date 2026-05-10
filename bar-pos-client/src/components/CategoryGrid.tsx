import type { Category } from '@/types';

type Props = {
  categories: Category[];
  activeCategory: Category | null;
  onSelect: (c: Category) => void;
};

export default function CategoryGrid({ categories, activeCategory, onSelect }: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--bg3)]/30">
      <div className="flex-1 overflow-y-auto p-2 scrollbar-none">
        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => {
            const active = activeCategory?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c)}
                className={`flex min-h-[90px] flex-col items-center justify-center gap-1 rounded-2xl p-3 text-center transition-all duration-200 active:scale-90 ${
                  active
                    ? 'border-2 border-[var(--green)] bg-white text-[var(--green)] shadow-md shadow-black/5'
                    : 'border border-transparent bg-white/20 text-[var(--text2)] hover:bg-white/60'
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                <span className="text-[10px] font-black uppercase leading-tight tracking-tight">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
