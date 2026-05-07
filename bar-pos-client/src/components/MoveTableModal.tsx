import { X } from 'lucide-react';
import type { Table } from '@/types';

type Props = {
  open: boolean;
  mode: 'move' | 'merge';
  selectedCount?: number;
  tables: Table[];
  openOrderTableIds: Set<number>;
  onSelect: (tableId: number) => void;
  onClose: () => void;
};

export default function MoveTableModal({
  open,
  mode,
  selectedCount = 0,
  tables,
  openOrderTableIds,
  onSelect,
  onClose,
}: Props) {
  if (!open) return null;

  const title =
    mode === 'merge'
      ? 'Unir mesa con...'
      : `Mover ${selectedCount} item${selectedCount !== 1 ? 's' : ''} a...`;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md app-no-drag"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg3)]/50 px-6 py-5">
          <div>
            <h3 className="text-lg font-black text-[var(--text)]">{title}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text3)]">
              Selecciona destino
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white p-2 text-[var(--text3)] shadow-sm transition-colors hover:text-[var(--red)]"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tables.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-[var(--text3)]">
              No hay otras mesas disponibles
            </p>
          ) : (
            <div className="space-y-2">
              {tables.map((t) => {
                const hasOrder = openOrderTableIds.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelect(t.id)}
                    className="app-no-drag flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg3)] px-4 py-3 text-left transition hover:border-[var(--green)] hover:bg-[var(--bg4)] active:scale-[0.98]"
                  >
                    <span className="font-black text-[var(--text)]">{t.name}</span>
                    {hasOrder ? (
                      <span className="rounded-full border border-[var(--red)]/40 bg-[var(--red-pale)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[var(--red)]">
                        Abierta
                      </span>
                    ) : (
                      <span className="rounded-full border border-[var(--green2)] bg-[var(--green-dim)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[var(--green)]">
                        Libre
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg3)]/50 p-5">
          <button
            type="button"
            onClick={onClose}
            className="app-no-drag min-h-[44px] w-full rounded-xl border-2 border-[var(--border2)] text-sm font-bold text-[var(--text3)] transition hover:border-[var(--red)]/50 hover:text-[var(--red)] active:scale-[0.98]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
