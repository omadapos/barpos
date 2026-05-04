import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LogOut, Printer, X, Wine } from 'lucide-react';
import { useConnectionStore } from '@/store/useConnectionStore';
import PrinterSettingsModal from '@/components/PrinterSettingsModal';

export type MainScreen = 'map' | 'order' | 'reports';

type Props = {
  main: MainScreen;
  /** En pantalla de orden: mesa vs ticket directo (para tab activo). */
  orderContext?: 'table' | 'walkin' | null;
  onGoMap: () => void;
  onGoReports: () => void;
  onQuickSale: () => void;
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

  return (
    <header className="app-drag flex h-14 min-h-[56px] w-full min-w-0 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-white px-4 shadow-sm md:gap-3">
      {/* Izquierda: logo + tabs */}
      <div className="app-no-drag flex min-w-0 flex-1 items-center gap-4 overflow-hidden md:gap-6">
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--green)] text-white">
            <Wine className="h-5 w-5" />
          </div>
          <div className="text-lg font-bold tracking-tight text-[var(--text)]">Bar POS</div>
        </div>

        <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overscroll-x-contain py-1 sm:gap-3">
          <button
            type="button"
            onClick={onGoMap}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
              tabMesas
                ? 'bg-[var(--green-pale)] text-[var(--green)]'
                : 'text-[var(--text3)] hover:bg-[var(--bg3)] hover:text-[var(--text2)]'
            }`}
          >
            Mesas
          </button>
          <button
            type="button"
            onClick={onQuickSale}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
              tabCaja
                ? 'bg-[var(--green-pale)] text-[var(--green)]'
                : 'text-[var(--text3)] hover:bg-[var(--bg3)] hover:text-[var(--text2)]'
            }`}
          >
            Caja rápida
          </button>
        </nav>
      </div>

      {/* Derecha */}
      <div className="app-no-drag flex shrink-0 items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-[var(--text2)]">
            {format(clock, 'h:mm a', { locale: es })}
          </span>
          <div title={online ? 'Conectado' : 'Sin conexión'}>
            <span
              className={`block h-2 w-2 rounded-full ${
                online ? 'animate-pulse bg-[var(--green2)]' : 'bg-[var(--red)]'
              }`}
            />
          </div>
        </div>

        <div className="h-4 w-px bg-[var(--border)]" />

        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--green3)] to-[var(--green)] text-[11px] font-bold text-white shadow-sm"
            title={session.username}
          >
            {initials(session.username)}
          </div>
          <button
            type="button"
            onClick={session.onSignOut}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text2)] transition-all hover:bg-[var(--bg3)] active:scale-95"
          >
            <LogOut className="h-4 w-4 text-[var(--text3)]" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {window.electronEnv?.printThermalReceipt && (
            <button
              type="button"
              onClick={() => setPrinterOpen(true)}
              className="rounded-lg p-2 text-[var(--text3)] transition-colors hover:bg-[var(--bg3)] hover:text-[var(--text2)]"
              title="Impresora térmica"
            >
              <Printer className="h-5 w-5" />
            </button>
          )}

          {window.electronEnv?.closeWindow && (
            <button
              type="button"
              onClick={() => window.electronEnv?.closeWindow()}
              className="rounded-lg p-2 text-[var(--text3)] transition-colors hover:bg-[var(--red-pale)] hover:text-[var(--red)]"
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
