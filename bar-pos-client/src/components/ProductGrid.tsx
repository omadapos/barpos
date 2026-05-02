import type { Product } from '@/types';
import { formatMoney } from '@/lib/format';

type Props = {
  products: Product[];
  isBottleCategory: boolean;
  onProduct: (p: Product) => void;
};

export default function ProductGrid({ products, isBottleCategory, onProduct }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 xl:grid-cols-4">
      {products.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onProduct(p)}
          className={`app-no-drag flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-[var(--radius)] border px-2 py-3 text-center shadow-sm transition hover:border-[var(--green2)] active:scale-[0.97] ${
            isBottleCategory
              ? 'border-[var(--green-dim)] bg-[var(--bg3)]'
              : 'border-[var(--border)] bg-[var(--bg3)]'
          }`}
        >
          <span className="text-[26px] leading-none" aria-hidden>
            🥃
          </span>
          <span className="text-sm font-semibold leading-tight text-[var(--text)]">{p.name}</span>
          <span className="text-base font-bold text-[var(--green)]">
            {isBottleCategory ? 'Medidas' : formatMoney(p.price)}
          </span>
        </button>
      ))}
    </div>
  );
}
