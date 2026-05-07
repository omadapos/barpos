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
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg3)]/50 px-8 py-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl bg-white p-2 text-[var(--green)] shadow-sm">
              <Globe className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black text-[var(--text)]">
                Ajustes de Sistema
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text3)]">
                Conexion remota
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white p-2 text-[var(--text3)] shadow-sm transition-colors hover:text-[var(--red)]"
            aria-label="Cerrar ajustes"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-8">
          <div className="space-y-2">
            <label className="ml-1 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--text2)]">
              <Globe className="h-3 w-3" /> URL de la API
            </label>
            <div className="w-full break-all rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm font-bold text-[var(--text)]">
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
        </div>

        <div className="flex shrink-0 gap-3 border-t border-[var(--border)] bg-[var(--bg3)]/50 p-8">
          <button
            type="button"
            onClick={handleSave}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--green)] px-4 text-sm font-black uppercase tracking-wider text-white transition active:scale-95"
          >
            <Check className="h-4 w-4" />
            Guardar
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl border-2 border-[var(--border2)] bg-white px-4 text-xs font-black uppercase tracking-wider text-[var(--text3)] transition hover:bg-[var(--bg3)] active:scale-95"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
