import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LogOut, Printer, X, Wine } from 'lucide-react';
import { useConnectionStore } from '@/store/useConnectionStore';
import PrinterSettingsModal from '@/components/PrinterSettingsModal';
import type { Shift } from '@/api/shifts.api';

export type MainScreen = 'map' | 'order' | 'reports';

type Props = {
  main: MainScreen;
  /** En pantalla de orden: mesa vs ticket directo (para tab activo). */
  orderContext?: 'table' | 'walkin' | null;
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
  onGoMap,
  onQuickSale,
  shift,
  canCloseShift,
  onCloseShift,
  session,
}: Props) {
  const [clock, setClock] = useState(() => new Date());
  const [printerOpen, setPrinterOpen] = useState(false);
  const online = useConnectionStore((s) => s.online);

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const tabMesas = main === 'map';
  const tabCaja = main === 'order' && orderContext === 'walkin';
  const shiftOpenedAt = shift?.openedAt ?? shift?.createdAt;

  return (
    <header className="app-drag flex h-16 min-h-[64px] w-full min-w-0 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-white/80 px-6 backdrop-blur-xl md:gap-4 z-[100]">
      {/* Izquierda: logo + tabs */}
      <div className="app-no-drag flex min-w-0 flex-1 items-center gap-6 overflow-hidden">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--green)] to-[var(--green3)] text-white shadow-lg shadow-[var(--green)]/20">
            <Wine className="h-6 w-6" />
          </div>
          <div className="hidden lg:block">
            <div className="text-lg font-black tracking-tighter text-[var(--text)] leading-none">Bar POS</div>
            <div className="text-[9px] font-black text-[var(--green)] uppercase tracking-[0.2em] mt-0.5">Premium</div>
          </div>
        </div>

        <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden py-1">
          <button
            type="button"
            onClick={onGoMap}
            className={`whitespace-nowrap rounded-xl px-5 py-2 text-sm font-black transition-all duration-300 ${
              tabMesas
                ? 'bg-white text-[var(--green)] shadow-sm border border-[var(--border)] scale-105'
                : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-white/50'
            }`}
          >
            MESAS
          </button>
          <button
            type="button"
            onClick={onQuickSale}
            className={`whitespace-nowrap rounded-xl px-5 py-2 text-sm font-black transition-all duration-300 ${
              tabCaja
                ? 'bg-white text-[var(--green)] shadow-sm border border-[var(--border)] scale-105'
                : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-white/50'
            }`}
          >
            CAJA RÁPIDA
          </button>
        </nav>
      </div>

      {/* Derecha */}
      <div className="app-no-drag flex shrink-0 items-center gap-4">
        <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-white/50 border border-[var(--border)]">
          {shift && (
            <button
              type="button"
              onClick={canCloseShift ? onCloseShift : undefined}
              className={`rounded-xl border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                canCloseShift
                  ? 'border-[var(--green)] text-[var(--green)] hover:bg-[var(--green-pale)]'
                  : 'border-[var(--border)] text-[var(--text3)]'
              }`}
              title={canCloseShift ? 'Cerrar turno' : 'Turno abierto'}
            >
              Turno {shiftOpenedAt ? format(new Date(shiftOpenedAt), 'h:mm a', { locale: es }) : 'abierto'}
            </button>
          )}
          <span className="font-black text-sm text-[var(--text2)] tracking-tight">
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-black text-white shadow-lg"
              title={session.username}
            >
              {initials(session.username)}
            </div>
            <div className="hidden xl:block">
               <div className="text-xs font-black text-[var(--text)] leading-none">{session.username}</div>
               <div className="text-[9px] font-bold text-[var(--text3)] uppercase mt-0.5">Operador</div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={session.onSignOut}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[var(--border)] text-[var(--text2)] shadow-sm transition-all hover:bg-[var(--red-pale)] hover:text-[var(--red)] hover:border-[var(--red-pale)] active:scale-90"
            title="Cerrar Sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
          {window.electronEnv?.printThermalReceipt && (
            <button
              type="button"
              onClick={() => setPrinterOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[var(--border)] text-[var(--text2)] shadow-sm transition-all hover:bg-[var(--bg3)] active:scale-90"
              title="Ajustes de Impresora"
            >
              <Printer className="h-5 w-5" />
            </button>
          )}

          {window.electronEnv?.closeWindow && (
            <button
              type="button"
              onClick={() => window.electronEnv?.closeWindow()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[var(--border)] text-[var(--text2)] shadow-sm transition-all hover:bg-[var(--red-pale)] hover:text-[var(--red)] hover:border-[var(--red-pale)] active:scale-90"
              title="Cerrar Ventana"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <PrinterSettingsModal open={printerOpen} onClose={() => setPrinterOpen(false)} />
    </header>
  );
}
