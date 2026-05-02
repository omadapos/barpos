import { useEffect, useState } from 'react';
import { X, Delete } from 'lucide-react';

const ROW1 = 'QWERTYUIOP'.split('');
const ROW2 = 'ASDFGHJKL'.split('');
const ROW3 = 'ZXCVBNM'.split('');

type Props = {
  open: boolean;
  initial: string;
  onClose: () => void;
  onSave: (note: string) => Promise<void>;
};

export default function OrderNoteModal({ open, initial, onClose, onSave }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setText(initial);
  }, [open, initial]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const append = (ch: string) => {
    if (text.length >= 500) return;
    setText((t) => t + ch);
  };

  const back = () => setText((t) => t.slice(0, -1));

  const save = async () => {
    setBusy(true);
    try {
      await onSave(text.trim());
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const keyBtn = (ch: string) => (
    <button
      key={ch}
      type="button"
      disabled={busy}
      onClick={() => append(ch)}
      className="flex min-h-[44px] min-w-[36px] flex-1 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] text-sm font-bold text-[var(--text)] transition hover:border-[var(--border2)] hover:bg-[var(--bg4)] active:scale-[0.96] disabled:opacity-40 sm:min-h-[48px] sm:text-base"
    >
      {ch}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/45 p-3 backdrop-blur-[2px] app-no-drag"
      onClick={onClose}
    >
      <div
        className="modal-enter w-full max-w-[400px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg2)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-lg font-bold text-[var(--text)]">Nota en la orden</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text2)] hover:bg-[var(--bg3)]"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="border-b border-[var(--border)] px-4 py-3">
          <div className="min-h-[72px] rounded-[var(--radius)] border border-[var(--border2)] bg-[var(--bg3)] px-3 py-2 text-sm text-[var(--text2)]">
            {text || <span className="text-[var(--text3)]">Escribe aquí…</span>}
          </div>
        </div>
        <div className="max-h-[45vh] space-y-1.5 overflow-y-auto p-3 scrollbar-emerald">
          <div className="flex justify-center gap-1">{ROW1.map(keyBtn)}</div>
          <div className="flex justify-center gap-1 pl-4">{ROW2.map(keyBtn)}</div>
          <div className="flex justify-center gap-1">
            <button
              type="button"
              disabled={busy}
              onClick={back}
              className="flex min-h-[44px] min-w-[52px] items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg2)] text-[var(--red)] transition hover:bg-[var(--bg4)] active:scale-[0.96] sm:min-h-[48px]"
              aria-label="Borrar"
            >
              <Delete className="h-5 w-5" />
            </button>
            {ROW3.map(keyBtn)}
          </div>
          <div className="flex gap-1 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => append(' ')}
              className="min-h-[44px] flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] text-sm font-semibold text-[var(--text2)] hover:bg-[var(--bg4)] active:scale-[0.96] sm:min-h-[48px]"
            >
              Espacio
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => append('Ñ')}
              className="min-h-[44px] w-14 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] text-sm font-bold text-[var(--text)] hover:bg-[var(--bg4)] active:scale-[0.96] sm:min-h-[48px]"
            >
              Ñ
            </button>
          </div>
        </div>
        <div className="flex gap-2 border-t border-[var(--border)] p-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="min-h-[48px] flex-1 rounded-[var(--radius)] border border-[var(--border2)] text-sm font-semibold text-[var(--text3)] hover:border-[var(--green)] hover:text-[var(--text2)]"
          >
            Volver
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="min-h-[48px] flex-[2] rounded-[var(--radius)] bg-[var(--green3)] text-sm font-bold text-white transition hover:bg-[var(--green2)] active:scale-[0.97] disabled:opacity-50"
          >
            Guardar nota
          </button>
        </div>
      </div>
    </div>
  );
}
