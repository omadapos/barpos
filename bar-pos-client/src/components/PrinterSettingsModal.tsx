import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  defaultThermalSettings,
  loadThermalSettings,
  saveThermalSettings,
  toElectronPrintConfig,
  type ThermalConnection,
  type ThermalPrinterSettings,
} from '@/lib/thermalPrinterConfig';
import { buildReceiptPayload } from '@/lib/buildReceiptPayload';
import type { Order } from '@/types';

type PrinterRow = { name: string; displayName?: string; description?: string; isDefault?: boolean };

type Props = {
  open: boolean;
  onClose: () => void;
};

function fakeTestOrder(): Order {
  const now = new Date().toISOString();
  return {
    id: 0,
    tableId: null,
    tableName: 'PRUEBA',
    status: 'open',
    paymentMethod: null,
    subtotal: 100,
    tax: 0,
    total: 100,
    itemCount: 1,
    createdAt: now,
    notes: 'Ticket de prueba',
    items: [
      {
        id: 0,
        orderId: 0,
        productId: 0,
        productName: 'Artículo de prueba',
        categoryName: 'Test',
        measureName: null,
        unitPrice: 100,
        quantity: 1,
        subtotal: 100,
      },
    ],
  };
}

export default function PrinterSettingsModal({ open, onClose }: Props) {
  const [s, setS] = useState<ThermalPrinterSettings>(() => loadThermalSettings());
  const [printers, setPrinters] = useState<PrinterRow[]>([]);
  const [comPorts, setComPorts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setS(loadThermalSettings());
    void (async () => {
      try {
        const list = await window.electronEnv?.listThermalPrinters?.();
        if (Array.isArray(list)) setPrinters(list);
      } catch {
        setPrinters([]);
      }
      try {
        const coms = await window.electronEnv?.listComPorts?.();
        if (Array.isArray(coms)) setComPorts(coms);
        else setComPorts([]);
      } catch {
        setComPorts([]);
      }
    })();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const persist = () => saveThermalSettings(s);

  const handleTest = async () => {
    const api = window.electronEnv?.printThermalReceipt;
    if (!api) {
      toast.error('Solo disponible en la app de escritorio.');
      return;
    }
    setBusy(true);
    try {
      const saved = saveThermalSettings(s);
      const order = fakeTestOrder();
      const payload = buildReceiptPayload(order, 'cash', saved);
      payload.createdAt = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
      const result = await api({
        config: toElectronPrintConfig(saved) as Record<string, unknown>,
        payload: { ...payload } as Record<string, unknown>,
      });
      if (result.ok) toast.success('Enviado a la impresora');
      else toast.error(result.error || 'Error al imprimir');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al imprimir');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setS({ ...defaultThermalSettings });
    saveThermalSettings(defaultThermalSettings);
    toast.success('Valores por defecto');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[140] overflow-y-auto bg-slate-900/45 backdrop-blur-[2px] app-no-drag"
      onClick={onClose}
      role="presentation"
    >
      <div className="flex min-h-[100dvh] w-full items-center justify-center p-4">
        <div
          className="modal-enter max-h-[min(90dvh,90vh)] w-full max-w-md overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg2)] p-5 shadow-2xl scrollbar-emerald"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[var(--text)]">Impresora térmica 80 mm</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text2)] hover:bg-[var(--bg3)]"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-[var(--text3)]">
          <strong className="text-[var(--text2)]">Red:</strong> TCP 9100 a la IP de la impresora.{' '}
          <strong className="text-[var(--text2)]">USB:</strong> el cable USB debe aparecer como{' '}
          <em>puerto COM</em> (Administrador de dispositivos → Puertos COM y LPT). Escriba ese COM
          abajo o elija uno de la lista si Windows lo detectó. Si solo ve la impresora en
          &quot;Impresoras&quot; sin COM, instale el driver USB–serie del fabricante o use la
          impresora en modo red.
        </p>

        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]">
          <input
            type="checkbox"
            checked={s.printOnPay}
            onChange={(e) => setS((p) => ({ ...p, printOnPay: e.target.checked }))}
            className="accent-[var(--green2)]"
          />
          Imprimir ticket al cobrar
        </label>

        <label className="mb-2 block text-xs font-semibold text-[var(--text3)]">Nombre del local</label>
        <input
          className="mb-2 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)]"
          value={s.businessName}
          onChange={(e) => setS((p) => ({ ...p, businessName: e.target.value }))}
          maxLength={48}
        />
        <label className="mb-2 block text-xs font-semibold text-[var(--text3)]">Dirección</label>
        <input
          className="mb-2 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)]"
          value={s.businessAddress}
          onChange={(e) => setS((p) => ({ ...p, businessAddress: e.target.value }))}
          maxLength={80}
        />
        <label className="mb-2 block text-xs font-semibold text-[var(--text3)]">Teléfono</label>
        <input
          className="mb-2 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)]"
          value={s.businessPhone}
          onChange={(e) => setS((p) => ({ ...p, businessPhone: e.target.value }))}
          maxLength={24}
        />
        <label className="mb-2 block text-xs font-semibold text-[var(--text3)]">Mensaje final (gracias)</label>
        <input
          className="mb-3 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)]"
          value={s.footerThanks}
          onChange={(e) => setS((p) => ({ ...p, footerThanks: e.target.value }))}
          maxLength={120}
        />

        <div className="mb-3 flex gap-3 text-sm">
          <label className="flex items-center gap-2 text-[var(--text)]">
            <input
              type="radio"
              name="conn"
              checked={s.connection === 'tcp'}
              onChange={() => setS((p) => ({ ...p, connection: 'tcp' as ThermalConnection }))}
            />
            Red (TCP)
          </label>
          <label className="flex items-center gap-2 text-[var(--text)]">
            <input
              type="radio"
              name="conn"
              checked={s.connection === 'com'}
              onChange={() => setS((p) => ({ ...p, connection: 'com' as ThermalConnection }))}
            />
            USB (COM)
          </label>
        </div>

        {s.connection === 'tcp' ? (
          <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--text3)]">IP o host</label>
              <input
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)]"
                value={s.tcpHost}
                onChange={(e) => setS((p) => ({ ...p, tcpHost: e.target.value }))}
                placeholder="192.168.0.100"
              />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-xs text-[var(--text3)]">Puerto</label>
              <input
                type="number"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-[var(--text)]"
                value={s.tcpPort}
                onChange={(e) =>
                  setS((p) => ({ ...p, tcpPort: Number(e.target.value) || 9100 }))
                }
                min={1}
                max={65535}
              />
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <label className="mb-1 block text-xs text-[var(--text3)]">
              Puerto USB (COM)
              {comPorts.length > 0 && (
                <span className="ml-1 font-normal text-[var(--text3)]">
                  · {comPorts.length} detectado{comPorts.length === 1 ? '' : 's'}
                </span>
              )}
            </label>
            <input
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-[var(--text)]"
              list="barpos-com-ports"
              value={s.comPort}
              onChange={(e) =>
                setS((p) => ({
                  ...p,
                  comPort: e.target.value.trim().toUpperCase().replace(/^\\\\\.\\/i, ''),
                }))
              }
              placeholder="COM3"
              autoComplete="off"
            />
            <datalist id="barpos-com-ports">
              {comPorts.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            {comPorts.length === 0 && (
              <p className="mt-1 text-[10px] text-[var(--text3)]">
                No se listaron COM automáticamente: escriba el que ve en el Administrador de
                dispositivos (ej. COM3).
              </p>
            )}
          </div>
        )}

        <div className="mb-3 grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-[var(--text3)]">Controlador ESC/POS</label>
            <select
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-[var(--text)]"
              value={s.driver}
              onChange={(e) =>
                setS((p) => ({
                  ...p,
                  driver: e.target.value === 'STAR' ? 'STAR' : 'EPSON',
                }))
              }
            >
              <option value="EPSON">EPSON (más común)</option>
              <option value="STAR">STAR</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text3)]">Ancho (caracteres)</label>
            <select
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-[var(--text)]"
              value={s.width}
              onChange={(e) =>
                setS((p) => ({
                  ...p,
                  width: Number(e.target.value) as 42 | 48 | 56,
                }))
              }
            >
              <option value={42}>42</option>
              <option value={48}>48 (80 mm típico)</option>
              <option value={56}>56</option>
            </select>
          </div>
        </div>

        {printers.length > 0 && (
          <div className="mb-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] p-2">
            <p className="mb-1 text-[10px] font-semibold uppercase text-[var(--text3)]">
              Impresoras del sistema (referencia)
            </p>
            <ul className="max-h-24 overflow-y-auto text-[11px] text-[var(--text2)] scrollbar-emerald">
              {printers.map((p) => (
                <li key={p.name} className="truncate">
                  {p.displayName || p.name}
                  {p.isDefault ? ' · predeterminada' : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              persist();
              toast.success('Guardado');
              onClose();
            }}
            className="min-h-[44px] flex-1 rounded-[var(--radius)] bg-[var(--green3)] font-semibold text-white hover:bg-[var(--green2)] disabled:opacity-50"
          >
            Guardar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleTest()}
            className="min-h-[44px] flex-1 rounded-[var(--radius)] border border-[var(--border2)] font-semibold text-[var(--text2)] hover:border-[var(--green)]"
          >
            Probar
          </button>
        </div>
        <button
          type="button"
          className="mt-2 w-full text-xs text-[var(--text3)] underline"
          onClick={reset}
        >
          Restaurar valores por defecto
        </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
