import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LogOut, Printer, X } from 'lucide-react';
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
    <header className="app-drag flex h-[52px] min-h-[52px] w-full min-w-0 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--bg2)] px-2 md:gap-3 md:px-4">
      {/* Izquierda: logo + tabs; puede hacer scroll horizontal si no cabe (body tiene overflow-x hidden). */}
      <div className="app-no-drag flex min-w-0 flex-1 items-center gap-2 overflow-hidden md:gap-3">
        <div className="flex shrink-0 items-center gap-2 rounded-[var(--radius)] border border-[var(--border2)] bg-[var(--bg3)] px-2 py-1">
          <span className="text-lg" aria-hidden>
            🍹
          </span>
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-bold text-[var(--text)]">Bar POS</div>
            <div className="hidden text-[9px] font-medium uppercase tracking-wide text-[var(--text3)] sm:block">
              Sistema de ventas
            </div>
          </div>
        </div>

        <nav className="scrollbar-emerald flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overscroll-x-contain py-0.5 sm:gap-1">
          <button
            type="button"
            onClick={onGoMap}
            className={`rounded-[var(--radius)] px-2 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm ${tabMesas
                ? 'border border-[var(--green2)] bg-[var(--green-dim)] text-[var(--green)]'
                : 'border border-transparent text-[var(--text3)] hover:text-[var(--text2)]'
              }`}
          >
            Mesas
          </button>
          <button
            type="button"
            onClick={onQuickSale}
            className={`rounded-[var(--radius)] px-2 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm ${tabCaja
                ? 'border border-[var(--green2)] bg-[var(--green-dim)] text-[var(--green)]'
                : 'border border-transparent text-[var(--text3)] hover:text-[var(--text2)]'
              }`}
          >
            Caja rápida
          </button>
        </nav>
      </div>

      {/* Derecha: siempre visible (no queda fuera del viewport). */}
      <div className="app-no-drag flex shrink-0 items-center gap-1.5 border-l border-[var(--border)] pl-2 md:gap-3 md:pl-3">
        <span
          className="hidden font-mono text-xs text-[var(--text2)] sm:inline md:text-sm"
          title="Hora local"
        >
          {format(clock, 'h:mm a', { locale: es })}
        </span>

        <div title={online ? 'Conectado' : 'Sin conexión'}>
          <span
            className={`block h-2 w-2 rounded-full ${online ? 'bg-[var(--green2)] dot-occupied' : 'bg-[var(--red)]'
              }`}
          />
        </div>

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--green3)] text-xs font-bold text-white"
          title={session.username}
        >
          {initials(session.username)}
        </div>

        <button
          type="button"
          onClick={session.onSignOut}
          className="flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border2)] bg-[var(--bg3)] px-2 py-1.5 text-[11px] font-semibold text-[var(--text)] shadow-sm transition hover:border-[var(--green2)] hover:bg-[var(--green-dim)] hover:text-[var(--green)] md:px-3 md:text-xs"
          title="Cerrar sesión"
          aria-label="Cerrar sesión (logout)"
        >
          <LogOut className="h-4 w-4 shrink-0 text-[var(--green3)]" aria-hidden />
          <span className="whitespace-nowrap">Salir</span>
        </button>

        {window.electronEnv?.printThermalReceipt && (
          <button
            type="button"
            onClick={() => setPrinterOpen(true)}
            className="rounded-lg p-1.5 text-[var(--text3)] hover:bg-[var(--bg3)]"
            aria-label="Impresora térmica"
            title="Impresora térmica 80 mm"
          >
            <Printer className="h-5 w-5" />
          </button>
        )}

        {window.electronEnv?.closeWindow && (
          <button
            type="button"
            onClick={() => window.electronEnv?.closeWindow()}
            className="rounded-lg p-1.5 text-[var(--text3)] hover:bg-[var(--bg3)]"
            aria-label="Cerrar aplicación"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <PrinterSettingsModal open={printerOpen} onClose={() => setPrinterOpen(false)} />
    </header>
  );
}
