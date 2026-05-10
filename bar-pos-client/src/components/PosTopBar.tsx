import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LogOut, Settings, SquarePower, X, Wine } from 'lucide-react';
import { useConnectionStore } from '@/store/useConnectionStore';
import PrinterSettingsModal from '@/components/PrinterSettingsModal';
import type { Shift } from '@/api/shifts.api';

export type MainScreen = 'map' | 'order' | 'reports';

type Props = {
  main: MainScreen;
  /** En pantalla de orden: mesa vs ticket directo (para tab activo). */
  orderContext?: 'table' | 'walkin' | null;
  tableButtonState?: 'idle' | 'send' | 'print';
  pendingItemsCount?: number;
  onGoMap: () => void;
  onGoReports: () => void;
  onQuickSale: () => void;
  shift: Shift | null;
  canCloseShift: boolean;
  onCloseShift: () => void;
  session: { username: string; onSignOut: () => void };
};

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export default function PosTopBar({
  main,
  orderContext,
  tableButtonState = 'idle',
  pendingItemsCount = 0,
  onGoMap,
  onQuickSale,
  shift,
  canCloseShift,
  onCloseShift,
  session,
}: Props) {
  const [clock, setClock] = useState(() => new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const online = useConnectionStore((s) => s.online);

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const tabMesas = main === 'map';
  const tabCaja = main === 'order' && orderContext === 'walkin';
  const shiftOpenedAt = shift?.openedAt ?? shift?.createdAt;
  const tableButtonLabel =
    tableButtonState === 'print'
      ? 'IMPRIMIR Y MESAS'
      : tableButtonState === 'send'
        ? `ENVIAR Y MESAS${pendingItemsCount > 0 ? ` (${pendingItemsCount})` : ''}`
        : 'MESAS';

  return (
    <header className="app-drag flex h-16 min-h-[64px] w-full min-w-0 shrink-0 items-center gap-2 border-b border-white/10 bg-[#10151b] px-6 text-white shadow-[0_10px_30px_rgba(15,23,42,0.22)] md:gap-4 z-[100]">
      {/* Izquierda: logo + tabs */}
      <div className="app-no-drag flex min-w-0 flex-1 items-center gap-6 overflow-hidden">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--green2)] to-[var(--green3)] text-white shadow-lg shadow-[var(--green)]/25">
            <Wine className="h-6 w-6" />
          </div>
          <div className="hidden lg:block">
            <div className="text-lg font-black tracking-tighter text-white leading-none">Bar POS</div>
            <div className="text-[9px] font-black text-[var(--green2)] uppercase tracking-[0.2em] mt-0.5">Premium</div>
          </div>
        </div>

        <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden py-1">
          <button
            type="button"
            onClick={onGoMap}
            className={`whitespace-nowrap rounded-xl px-5 py-2 text-sm font-black transition-all duration-300 ${
              tabMesas
                ? 'bg-white/10 text-white shadow-sm border border-white/10 scale-105'
                : tableButtonState !== 'idle'
                  ? 'bg-[var(--green3)] text-white shadow-sm border border-[var(--green2)] hover:bg-[var(--green2)]'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tableButtonLabel}
          </button>
          <button
            type="button"
            onClick={onQuickSale}
            className={`whitespace-nowrap rounded-xl px-5 py-2 text-sm font-black transition-all duration-300 ${
              tabCaja
                ? 'bg-white/10 text-white shadow-sm border border-white/10 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            CAJA RÁPIDA
          </button>
        </nav>
      </div>

      {/* Derecha */}
      <div className="app-no-drag flex shrink-0 items-center gap-4">
        <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-1.5">
          {shift && (
            <div
              className="rounded-xl border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-300"
              title="Turno abierto"
            >
              Turno {shiftOpenedAt ? format(new Date(shiftOpenedAt), 'h:mm a', { locale: es }) : 'abierto'}
            </div>
          )}
          <span className="font-black text-sm text-white tracking-tight">
            {format(clock, 'h:mm a', { locale: es })}
          </span>
          <div title={online ? 'Conectado' : 'Sin conexión'} className="flex items-center">
            <span
              className={`block h-2.5 w-2.5 rounded-full ring-4 ring-white/30 ${
                online ? 'animate-pulse bg-[var(--green2)]' : 'bg-[var(--red)]'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 pl-2">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-black text-white shadow-lg"
              title={session.username}
            >
              {initials(session.username)}
            </div>
            <div className="hidden xl:block">
               <div className="text-xs font-black text-white leading-none">{session.username}</div>
               <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Operador</div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={session.onSignOut}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 shadow-sm transition-all hover:bg-white/10 hover:text-white active:scale-90"
            title="Cerrar Sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          {shift && canCloseShift && (
            <button
              type="button"
              onClick={onCloseShift}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/10 px-3 text-xs font-black uppercase tracking-wide text-red-300 shadow-sm transition-all hover:bg-[var(--red)] hover:text-white active:scale-90"
              title="Cerrar turno"
            >
              <SquarePower className="h-4 w-4" />
              <span className="hidden lg:inline">Cerrar turno</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 shadow-sm transition-all hover:bg-white/10 hover:text-white active:scale-90"
            title="Configuracion"
          >
            <Settings className="h-5 w-5" />
          </button>

          {window.electronEnv?.closeWindow && (
            <button
              type="button"
              onClick={() => window.electronEnv?.closeWindow()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 shadow-sm transition-all hover:bg-[var(--red)]/15 hover:text-red-300 active:scale-90"
              title="Cerrar Ventana"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <PrinterSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
