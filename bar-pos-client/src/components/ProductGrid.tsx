import type { Product } from '@/types';
import { formatMoney } from '@/lib/format';

type Props = {
  products: Product[];
  isBottleCategory: boolean;
  onProduct: (p: Product) => void;
};

export default function ProductGrid({ products, isBottleCategory, onProduct }: Props) {
  const fallbackIcon = isBottleCategory ? '🍾' : '🥃';

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => {
        const imageUrl = p.imageUrl?.trim();

        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onProduct(p)}
            className="group relative flex min-h-[172px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-95"
          >
            {imageUrl ? (
              <div className="relative h-24 w-full overflow-hidden bg-[var(--bg3)]">
                <img
                  src={imageUrl}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="mx-4 mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg3)] text-2xl transition-colors group-hover:bg-[var(--green-pale)]">
                {fallbackIcon}
              </div>
            )}

            <div className="flex flex-1 flex-col justify-between gap-1 p-4">
              <span className="text-sm font-bold leading-tight text-[var(--text)]">
                {p.name}
              </span>
              <span className="text-lg font-black text-[var(--green)]">
                {isBottleCategory ? 'Medidas' : formatMoney(p.price)}
              </span>
            </div>

            <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded-full bg-[var(--green)] p-1 text-white shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
