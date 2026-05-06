import { X, Globe, Key } from 'lucide-react';
import { getAppKey } from '@/config/tenant';
import { getApiBaseURL } from '@/lib/apiBaseUrl';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SystemSettingsModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div
        className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl"
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
            <label className="ml-1 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--text2)]">
              <Key className="h-3 w-3" /> App Key
            </label>
            <div className="min-h-16 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm font-bold text-[var(--text)]">
              {getAppKey()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
