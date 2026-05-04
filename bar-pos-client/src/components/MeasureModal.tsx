import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ChevronRight } from 'lucide-react';
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--text)]">{product.name}</h2>
            <p className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest">Seleccionar Medida</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-[var(--bg3)] p-2 text-[var(--text2)] transition hover:bg-[var(--bg4)]">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3">
          {isLoading && needsFetch ? (
            <div className="flex flex-col items-center py-12 gap-4">
              <Spinner className="h-10 w-10 border-t-[var(--green)]" />
              <span className="text-xs font-bold text-[var(--text3)] uppercase tracking-tighter">Cargando medidas...</span>
            </div>
          ) : (
            measures.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMeasure(m)}
                className="group flex w-full items-center justify-between rounded-2xl bg-[var(--bg3)] p-5 transition-all hover:bg-[var(--green-dim)] active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm text-2xl group-hover:scale-110 transition-transform">
                    {measureEmoji[m.measureName] ?? '🥃'}
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-black text-[var(--text)]">{m.measureName}</div>
                    <div className="text-sm font-bold text-[var(--green)]">{formatMoney(m.price)}</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-[var(--text3)] group-hover:text-[var(--green)] transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
