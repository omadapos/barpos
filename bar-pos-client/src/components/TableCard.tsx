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
  if (min < 1) return 'reciente';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
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

  const getStatusClasses = () => {
    if (occupied) {
      return 'border-[var(--green)] bg-[var(--green-pale)] shadow-sm';
    }
    return 'border-[var(--border)] bg-white hover:border-[var(--green2)] hover:shadow-md';
  };

  return (
    <div className="relative group">
      <button
        type="button"
        className={`relative flex min-h-[130px] w-full flex-col rounded-2xl border-2 p-5 text-left transition-all duration-200 active:scale-[0.98] app-no-drag ${getStatusClasses()}`}
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
        <div className="flex items-start justify-between">
          <span className="text-xl font-black tracking-tight text-[var(--text)]">{table.name}</span>
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${occupied ? 'bg-[var(--green)] text-white' : 'bg-[var(--bg3)] text-[var(--text3)]'}`}>
            <Users className="h-3 w-3" />
            {table.capacity}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-1">
          {occupied ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--green)] uppercase tracking-wider">Ocupada</span>
                <span className="text-[10px] font-medium text-[var(--text3)]">{formatElapsed(createdAt)}</span>
              </div>
              <div className="text-xl font-black text-[var(--green)]">
                {formatMoney(total ?? 0)}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--border2)]" />
              <span className="text-xs font-bold text-[var(--text3)] uppercase tracking-wider">Libre</span>
            </div>
          )}
        </div>
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/20 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-[var(--border)] bg-white py-1 shadow-2xl animate-in fade-in zoom-in duration-150">
            <button
              type="button"
              className="flex w-full items-center px-4 py-3 text-left text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg3)]"
              onClick={() => {
                setMenuOpen(false);
                onViewOrder();
              }}
            >
              Abrir Cuenta
            </button>
            <div className="h-px bg-[var(--border)] mx-2" />
            <button
              type="button"
              className="flex w-full items-center px-4 py-3 text-left text-sm font-semibold text-[var(--text3)] hover:bg-[var(--bg3)]"
              onClick={() => {
                setMenuOpen(false);
                toast('Mover mesa disponible en v2.2');
              }}
            >
              Mover Mesa
            </button>
          </div>
        </>
      )}
    </div>
  );
}
