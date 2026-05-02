import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Pencil, Trash2 } from 'lucide-react';
import { useTableStore } from '@/store/useTableStore';

export default function TableManagerModal({ open, onClose }) {
  const { fetchTables, tables } = useTableStore();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (open) fetchTables();
  }, [open, fetchTables]);

  useEffect(() => {
    if (!open) {
      setName('');
      setCapacity(4);
      setEditingId(null);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const startEdit = (t) => {
    setEditingId(t.id);
    setName(t.name);
    setCapacity(t.capacity);
  };

  const saveEdit = async () => {
    if (!editingId || !name.trim()) return;
    const res = await window.electronAPI.updateTable(editingId, {
      name: name.trim(),
      capacity: Number(capacity) || 4,
    });
    if (res) {
      toast.success('Mesa actualizada');
      setEditingId(null);
      setName('');
      setCapacity(4);
      await fetchTables();
    }
  };

  const addTable = async () => {
    if (!name.trim()) {
      toast.error('Indica el nombre');
      return;
    }
    await window.electronAPI.createTable({
      name: name.trim(),
      capacity: Number(capacity) || 4,
    });
    toast.success('Mesa creada');
    setName('');
    setCapacity(4);
    await fetchTables();
  };

  const toggle = async (id) => {
    await window.electronAPI.toggleTable(id);
    await fetchTables();
  };

  const remove = async (id) => {
    const res = await window.electronAPI.deleteTable(id);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success('Mesa eliminada');
    await fetchTables();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-600 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <h2 className="text-xl font-semibold">Gestionar mesas</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-800"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-4">
          {(tables || []).map((t) => (
            <div
              key={t.id}
              className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-slate-400">Capacidad: {t.capacity}</div>
                <div className="text-xs text-slate-500">
                  {t.active ? 'Visible en mapa' : 'Oculta'}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!t.active}
                  onChange={() => toggle(t.id)}
                />
                Activa
              </label>
              <button
                type="button"
                className="rounded-lg bg-slate-700 p-2 hover:bg-slate-600"
                onClick={() => startEdit(t)}
                aria-label="Editar"
              >
                <Pencil className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-900/60 p-2 hover:bg-red-800/80"
                onClick={() => remove(t.id)}
                aria-label="Eliminar"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-700 p-4">
          {editingId ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-amber-200">Editando mesa #{editingId}</p>
              <input
                className="min-h-[48px] rounded-lg border border-slate-600 bg-slate-800 px-3 text-lg"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="number"
                min={1}
                className="min-h-[48px] rounded-lg border border-slate-600 bg-slate-800 px-3 text-lg"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="min-h-[48px] flex-1 rounded-xl bg-emerald-600 font-semibold hover:bg-emerald-500"
                  onClick={saveEdit}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="min-h-[48px] flex-1 rounded-xl bg-slate-700 font-semibold hover:bg-slate-600"
                  onClick={() => {
                    setEditingId(null);
                    setName('');
                    setCapacity(4);
                  }}
                >
                  Cancelar edición
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <h3 className="font-medium text-slate-300">Nueva mesa</h3>
              <input
                className="min-h-[48px] rounded-lg border border-slate-600 bg-slate-800 px-3 text-lg"
                placeholder="Nombre (ej. Mesa 5)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="number"
                min={1}
                className="min-h-[48px] rounded-lg border border-slate-600 bg-slate-800 px-3 text-lg"
                placeholder="Capacidad"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
              <button
                type="button"
                className="min-h-[52px] rounded-xl bg-indigo-600 text-lg font-semibold hover:bg-indigo-500"
                onClick={addTable}
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
