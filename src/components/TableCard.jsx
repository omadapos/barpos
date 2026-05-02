import React, { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
import { formatMoney } from '@/lib/format';

export default function TableCard({
  table,
  occupied,
  itemCount,
  total,
  onOpen,
  onViewOrder,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimer = useRef(null);
  const menuRef = useRef(null);

  const clearTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const openMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(true);
  }, []);

  const onPointerDown = () => {
    clearTimer();
    longPressTimer.current = setTimeout(() => {
      setMenuOpen(true);
    }, 600);
  };

  const onPointerUp = () => {
    clearTimer();
  };

  const base =
    'relative flex min-h-[100px] cursor-pointer select-none flex-col justify-between rounded-xl border-2 p-4 text-left shadow-lg transition hover:brightness-110 active:scale-[0.99]';
  const avail =
    'border-emerald-600/50 bg-gradient-to-br from-emerald-900/80 to-emerald-950/90';
  const occ =
    'border-amber-500/60 bg-gradient-to-br from-amber-900/80 to-amber-950/90';

  return (
    <div className="relative">
      <button
        type="button"
        className={`${base} ${occupied ? occ : avail} w-full`}
        onClick={() => onOpen()}
        onContextMenu={openMenu}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-xl font-semibold text-white">{table.name}</span>
          <span className="flex items-center gap-1 text-sm text-slate-200">
            <Users className="h-4 w-4" />
            {table.capacity}
          </span>
        </div>
        {occupied ? (
          <div className="mt-2 text-sm text-amber-100">
            <div>{itemCount ?? 0} artículos</div>
            <div className="text-lg font-bold text-white">{formatMoney(total)}</div>
          </div>
        ) : (
          <div className="mt-2 text-sm font-medium text-emerald-200">Disponible</div>
        )}
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/40"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <div
            ref={menuRef}
            className="absolute right-0 top-full z-50 mt-1 min-w-[200px] overflow-hidden rounded-lg border border-slate-600 bg-slate-800 py-1 shadow-xl"
          >
            <button
              type="button"
              className="block w-full px-4 py-3 text-left text-sm hover:bg-slate-700"
              onClick={() => {
                setMenuOpen(false);
                onViewOrder();
              }}
            >
              Ver orden
            </button>
            <button
              type="button"
              className="block w-full px-4 py-3 text-left text-sm text-slate-400 hover:bg-slate-700"
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
