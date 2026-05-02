import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import type { BottleMeasure, Product } from '@/types';
import { productsApi } from '@/api/products.api';
import { formatMoney } from '@/lib/format';
import Spinner from './Spinner';

const measureEmoji: Record<string, string> = {
  Trago: '🥃',
  Cuarto: '🥃',
  Media: '🍾',
  Litro: '🍾',
};

type Props = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSelectMeasure: (m: BottleMeasure) => void;
};

export default function MeasureModal({ product, open, onClose, onSelectMeasure }: Props) {
  const needsFetch = !!(open && product && !product.measures?.length);

  const { data: fetched = [], isLoading } = useQuery({
    queryKey: ['measures', product?.id],
    queryFn: () => productsApi.getMeasures(product!.id),
    enabled: needsFetch,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !product) return null;

  const measures: BottleMeasure[] =
    product.measures?.length ? product.measures : fetched;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px] app-no-drag"
      onClick={onClose}
    >
      <div
        className="modal-enter w-[340px] max-w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg2)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">{product.name}</h2>
            <p className="mt-0.5 text-sm text-[var(--text3)]">Elige la medida</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text2)] hover:bg-[var(--bg3)]"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-2 overflow-y-auto p-4 scrollbar-emerald">
          {isLoading && needsFetch ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            measures.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMeasure(m)}
                className="flex min-h-[64px] w-full items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] px-4 py-3 text-left transition hover:border-[var(--green2)] hover:bg-[var(--green-dim)] active:scale-[0.97]"
              >
                <span className="text-2xl">{measureEmoji[m.measureName] ?? '🥃'}</span>
                <span className="flex-1 text-lg font-bold text-[var(--text)]">{m.measureName}</span>
                <span className="text-lg font-bold text-[var(--green)]">{formatMoney(m.price)}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
