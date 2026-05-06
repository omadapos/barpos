import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Globe, Key, X } from 'lucide-react';
import { clearAppKey, getAppKey, saveAppKey } from '@/config/tenant';
import { getApiBaseURL } from '@/lib/apiBaseUrl';

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: (appKey: string) => void;
};

export default function SystemSettingsModal({ open, onClose, onSaved }: Props) {
  const [appKey, setAppKey] = useState('');

  useEffect(() => {
    if (open) setAppKey(getAppKey());
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = appKey.trim();
    if (!trimmed) {
      toast.error('Escribe el App Key del terminal');
      return;
    }

    saveAppKey(trimmed);
    onSaved?.(trimmed);
    toast.success('App Key guardado');
    onClose();
  };

  const handleClear = () => {
    clearAppKey();
    setAppKey('');
    onSaved?.('');
    toast.success('App Key eliminado');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2.5rem] bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--text)]">
              Ajustes de Sistema
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text3)]">
              Conexion remota
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg3)] text-[var(--text2)] transition-all hover:bg-[var(--red-pale)] hover:text-[var(--red)] active:scale-90"
            aria-label="Cerrar ajustes"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="ml-1 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--text2)]">
              <Globe className="h-3 w-3" /> URL de la API
            </label>
            <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm font-bold text-[var(--text)]">
              {getApiBaseURL()}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="terminal-app-key"
              className="ml-1 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--text2)]"
            >
              <Key className="h-3 w-3" /> App Key del terminal
            </label>
            <input
              id="terminal-app-key"
              type="text"
              value={appKey}
              onChange={(e) => setAppKey(e.target.value)}
              placeholder="Pega aqui el App Key"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 font-mono text-sm font-bold text-[var(--text)] outline-none transition focus:border-[var(--green)] focus:ring-4 focus:ring-[var(--green-pale)]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--green)] px-4 text-sm font-black uppercase tracking-wider text-white transition active:scale-95"
            >
              <Check className="h-4 w-4" />
              Guardar
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-2xl border border-[var(--border)] bg-white px-4 text-xs font-black uppercase tracking-wider text-[var(--text2)] transition hover:bg-[var(--bg3)] active:scale-95"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
