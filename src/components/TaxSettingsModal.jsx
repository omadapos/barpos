import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';

export default function TaxSettingsModal({ open, onClose }) {
  const taxPercent = useOrderStore((s) => s.taxPercent);
  const setTaxPercent = useOrderStore((s) => s.setTaxPercent);
  const loadSettings = useOrderStore((s) => s.loadSettings);
  const [val, setVal] = useState('0');

  useEffect(() => {
    if (open) {
      loadSettings();
      setVal(String(taxPercent ?? 0));
    }
  }, [open, taxPercent, loadSettings]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const save = async () => {
    const n = Math.max(0, Math.min(100, parseFloat(val) || 0));
    await setTaxPercent(n);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-600 bg-slate-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Impuesto (%)</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-800">
            <X className="h-6 w-6" />
          </button>
        </div>
        <input
          type="number"
          min={0}
          max={100}
          step="0.01"
          className="mb-4 min-h-[52px] w-full rounded-xl border border-slate-600 bg-slate-800 px-4 text-xl"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <button
          type="button"
          onClick={save}
          className="min-h-[52px] w-full rounded-xl bg-indigo-600 text-lg font-semibold hover:bg-indigo-500"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
