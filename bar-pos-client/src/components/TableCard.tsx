import { useCallback, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
import type { Table } from '@/types';
import { formatMoney } from '@/lib/format';

function formatElapsed(iso?: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return '';
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `hace ${h}h ${m}min` : `hace ${h}h`;
}

type Props = {
  table: Table;
  occupied: boolean;
  itemCount?: number;
  total?: number;
  createdAt?: string;
  onOpen: () => void;
  onViewOrder: () => void;
};

export default function TableCard({
  table,
  occupied,
  itemCount,
  total,
  createdAt,
  onOpen,
  onViewOrder,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const openMenu = useCallback((e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(true);
  }, []);

  const base =
    'relative flex min-h-[112px] min-w-[180px] w-full cursor-pointer select-none flex-col rounded-[var(--radius-lg)] border p-4 text-left shadow-md transition-all duration-200 app-no-drag';

  return (
    <div className="relative">
      <button
        type="button"
        className={`${base} ${
          occupied
            ? 'border-[var(--border2)] bg-[var(--green-pale)] hover:brightness-105 active:scale-[0.99]'
            : 'border-[var(--border)] bg-[var(--bg3)] hover:border-[var(--border2)] hover:bg-[var(--bg4)] active:scale-[0.99]'
        }`}
        onClick={onOpen}
        onContextMenu={openMenu}
        onPointerDown={() => {
          clearTimer();
          longPressTimer.current = setTimeout(() => setMenuOpen(true), 600);
        }}
        onPointerUp={clearTimer}
        onPointerLeave={clearTimer}
        onPointerCancel={clearTimer}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-lg font-bold text-[var(--text)]">{table.name}</span>
          <span className="flex items-center gap-1 text-xs text-[var(--text2)]">
            <Users className="h-3.5 w-3.5" />
            {table.capacity} pers.
          </span>
        </div>

        <div className="mt-3 flex flex-1 flex-col justify-end gap-2">
          {occupied ? (
            <>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--green)]">
                <span className="dot-occupied h-2 w-2 shrink-0 rounded-full bg-[var(--green2)] ring-2 ring-[var(--green2)]/30" />
                OCUPADA
              </div>
              <div className="text-lg font-bold text-[var(--green)]">{formatMoney(total ?? 0)}</div>
              <div className="text-xs text-[var(--text2)]">
                {itemCount ?? 0} ítem{(itemCount ?? 0) !== 1 ? 's' : ''}
                {createdAt ? ` · ${formatElapsed(createdAt)}` : ''}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--text3)]">
                <span className="h-2 w-2 shrink-0 rounded-full border-2 border-[var(--text3)] bg-transparent" />
                LIBRE
              </div>
            </>
          )}
        </div>
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-slate-900/40 backdrop-blur-[1px] app-no-drag"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg2)] py-1 shadow-xl app-no-drag">
            <button
              type="button"
              className="block w-full px-4 py-3 text-left text-sm text-[var(--text)] hover:bg-[var(--bg3)]"
              onClick={() => {
                setMenuOpen(false);
                onViewOrder();
              }}
            >
              Ver orden
            </button>
            <button
              type="button"
              className="block w-full px-4 py-3 text-left text-sm text-[var(--text3)] hover:bg-[var(--bg3)]"
              onClick={() => {
                setMenuOpen(false);
                toast('Transferencia de mesa disponible en versión 2');
              }}
            >
              Transferir mesa (v2)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
