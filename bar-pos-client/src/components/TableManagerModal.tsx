import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Pencil, Trash2 } from 'lucide-react';
import type { Table } from '@/types';
import { tablesApi } from '@/api/tables.api';
import { useTableStore } from '@/store/useTableStore';
import Spinner from './Spinner';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function TableManagerModal({ open, onClose }: Props) {
  const { tables, openOrders, refresh } = useTableStore();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setName('');
      setCapacity(4);
      setEditingId(null);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const startEdit = (t: Table) => {
    setEditingId(t.id);
    setName(t.name);
    setCapacity(t.capacity);
  };

  const saveEdit = async () => {
    if (!editingId || !name.trim()) return;
    setBusy(true);
    try {
      await tablesApi.update(editingId, {
        name: name.trim(),
        capacity: Number(capacity) || 4,
      });
      toast.success('Mesa actualizada');
      setEditingId(null);
      setName('');
      setCapacity(4);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const addTable = async () => {
    if (!name.trim()) {
      toast.error('Indica el nombre');
      return;
    }
    setBusy(true);
    try {
      await tablesApi.create({
        name: name.trim(),
        capacity: Number(capacity) || 4,
      });
      toast.success('Mesa creada');
      setName('');
      setCapacity(4);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id: number) => {
    setBusy(true);
    try {
      await tablesApi.toggle(id);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (openOrders[id]) {
      toast.error('No se puede eliminar: hay una orden abierta en esta mesa.');
      return;
    }
    setBusy(true);
    try {
      await tablesApi.delete(id);
      toast.success('Mesa eliminada');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px] app-no-drag">
      <div className="modal-enter max-h-[90vh] w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg2)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-bold text-[var(--text)]">Gestionar mesas</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text2)] hover:bg-[var(--bg3)]"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-4 scrollbar-emerald">
          {busy && (
            <div className="mb-2 flex justify-center">
              <Spinner />
            </div>
          )}
          {tables.map((t) => (
            <div
              key={t.id}
              className="mb-3 flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[var(--text)]">{t.name}</div>
                <div className="text-sm text-[var(--text3)]">Capacidad: {t.capacity}</div>
                <div className="text-xs text-[var(--text3)]">
                  {t.active ? 'Visible en mapa' : 'Oculta'}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--text2)]">
                <input
                  type="checkbox"
                  checked={t.active}
                  onChange={() => toggle(t.id)}
                  disabled={busy}
                  className="accent-[var(--green2)]"
                />
                Activa
              </label>
              <button
                type="button"
                className="rounded-[var(--radius)] border border-[var(--border)] p-2 hover:bg-[var(--bg4)]"
                onClick={() => startEdit(t)}
                disabled={busy}
                aria-label="Editar"
              >
                <Pencil className="h-5 w-5 text-[var(--text2)]" />
              </button>
              <button
                type="button"
                className="rounded-[var(--radius)] border border-[var(--red)]/40 p-2 hover:bg-[var(--red)]/15 disabled:opacity-40"
                onClick={() => remove(t.id)}
                disabled={busy}
                aria-label="Eliminar"
              >
                <Trash2 className="h-5 w-5 text-[var(--red)]" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border)] p-4">
          {editingId != null ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-[var(--amber)]">Editando mesa #{editingId}</p>
              <input
                className="min-h-[48px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] px-3 text-lg text-[var(--text)]"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="number"
                min={1}
                className="min-h-[48px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] px-3 text-lg text-[var(--text)]"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="min-h-[48px] flex-1 rounded-[var(--radius)] bg-[var(--green3)] font-semibold text-white hover:bg-[var(--green2)] disabled:opacity-50"
                  onClick={() => void saveEdit()}
                  disabled={busy}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="min-h-[48px] flex-1 rounded-[var(--radius)] border border-[var(--border2)] text-[var(--text3)] hover:border-[var(--green)]"
                  onClick={() => {
                    setEditingId(null);
                    setName('');
                    setCapacity(4);
                  }}
                  disabled={busy}
                >
                  Cancelar edición
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold text-[var(--text2)]">Nueva mesa</h3>
              <input
                className="min-h-[48px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] px-3 text-lg text-[var(--text)]"
                placeholder="Nombre (ej. Mesa 5)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="number"
                min={1}
                className="min-h-[48px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] px-3 text-lg text-[var(--text)]"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
              <button
                type="button"
                className="min-h-[52px] rounded-[var(--radius)] bg-[var(--green3)] text-lg font-bold text-white hover:bg-[var(--green2)] disabled:opacity-50"
                onClick={() => void addTable()}
                disabled={busy}
              >
                Agregar mesa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
