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
        <div className="grid grid-cols-1 gap-2">
          {categories.map((c) => {
            const active = activeCategory?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c)}
                className={`flex min-h-[58px] items-center justify-center rounded-2xl px-4 py-3 text-center transition-all duration-200 active:scale-90 ${
                  active
                    ? 'border-2 border-[var(--green)] bg-white text-[var(--green)] shadow-md shadow-black/5'
                    : 'border border-white/70 bg-white/45 text-[var(--text2)] shadow-sm shadow-black/5 hover:bg-white/70 hover:shadow-md'
                }`}
              >
                <span className="text-sm font-black uppercase leading-tight tracking-normal">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
