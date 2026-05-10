import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Pencil, LayoutGrid, Plus } from 'lucide-react';
import type { Table } from '@/types';
import { tablesApi } from '@/api/tables.api';
import { useTableStore } from '@/store/useTableStore';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function TableManagerModal({ open, onClose }: Props) {
  const { tables, refresh } = useTableStore();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [editingId, setEditingId] = useState<number | null>(null);

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
      onClose();
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2.5rem] bg-white shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-8 py-6 bg-[var(--bg3)]/50">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-white shadow-sm text-[var(--green)]">
                <LayoutGrid className="h-6 w-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-[var(--text)]">Gestión de Mesas</h2>
                <p className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest">Configuración de Sala</p>
             </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white p-2 text-[var(--text3)] shadow-sm hover:text-[var(--red)] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tables.map((t) => (
              <div
                key={t.id}
                className={`group flex items-center gap-4 rounded-2xl border p-4 transition-all ${t.active ? 'bg-white border-[var(--border)]' : 'bg-[var(--bg3)] border-dashed opacity-60'}`}
              >
                <div className="flex-1">
                  <div className="font-black text-[var(--text)]">{t.name}</div>
                  <div className="text-xs font-bold text-[var(--text3)] uppercase">Capacidad: {t.capacity}</div>
                </div>
                
                <div className="flex items-center gap-2">
                   <button
                    onClick={() => toggle(t.id)}
                    disabled={busy}
                    className={`h-8 px-3 rounded-full text-[10px] font-black uppercase transition-all ${t.active ? 'bg-[var(--green-dim)] text-[var(--green)]' : 'bg-[var(--bg4)] text-[var(--text2)]'}`}
                  >
                    {t.active ? 'Activa' : 'Oculta'}
                  </button>
                  <button
                    className="p-2 rounded-lg text-[var(--text3)] hover:bg-[var(--bg3)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
                    onClick={() => startEdit(t)}
                    disabled={busy}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 bg-[var(--bg3)]/50 border-t border-[var(--border)] p-8">
           <div className="flex flex-col gap-4">
              <h3 className="text-sm font-black text-[var(--text2)] uppercase tracking-widest">
                {editingId ? `Editando ${name}` : 'Añadir Nueva Mesa'}
              </h3>
              <div className="flex gap-3">
                 <input
                  className="h-12 flex-[2] rounded-xl border border-[var(--border)] bg-white px-4 font-bold text-[var(--text)] focus:border-[var(--green)] outline-none transition disabled:opacity-50"
                  placeholder="Nombre de mesa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={busy}
                />
                <input
                  type="number"
                  className="h-12 flex-1 rounded-xl border border-[var(--border)] bg-white px-4 font-bold text-[var(--text)] focus:border-[var(--green)] outline-none transition disabled:opacity-50"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  disabled={busy}
                />
                {editingId ? (
                   <div className="flex gap-2">
                      <button onClick={saveEdit} className="btn-primary h-12 px-6 rounded-xl">Guardar</button>
                      <button onClick={() => setEditingId(null)} className="h-12 px-6 rounded-xl border-2 border-[var(--border2)] font-bold text-[var(--text3)]">X</button>
                   </div>
                ) : (
                  <button onClick={addTable} className="btn-primary h-12 px-6 rounded-xl flex items-center gap-2">
                    <Plus className="h-5 w-5" /> Añadir
                  </button>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
