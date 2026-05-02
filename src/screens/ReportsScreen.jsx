import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeft, FileDown } from 'lucide-react';
import Navbar from '@/components/Navbar.jsx';
import { useReportStore } from '@/store/useReportStore';
import { formatMoney } from '@/lib/format';

function pct(part, whole) {
  if (!whole) return '0.0';
  return ((part / whole) * 100).toFixed(1);
}

function escapeCsv(v) {
  const s = v == null ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export default function ReportsScreen({ onBack }) {
  const preset = useReportStore((s) => s.preset);
  const setPreset = useReportStore((s) => s.setPreset);
  const setCustomRange = useReportStore((s) => s.setCustomRange);
  const summary = useReportStore((s) => s.summary);
  const byCategory = useReportStore((s) => s.byCategory);
  const byProduct = useReportStore((s) => s.byProduct);
  const byTable = useReportStore((s) => s.byTable);
  const productCategoryFilter = useReportStore((s) => s.productCategoryFilter);
  const setProductCategoryFilter = useReportStore((s) => s.setProductCategoryFilter);
  const fetchAll = useReportStore((s) => s.fetchAll);
  const loading = useReportStore((s) => s.loading);

  const [expanded, setExpanded] = useState(null);
  const [detailRows, setDetailRows] = useState({});
  const [customA, setCustomA] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customB, setCustomB] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    setPreset('today');
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial
  }, []);

  const grandCatTotal = (byCategory || []).reduce((a, r) => a + (r.total || 0), 0);

  const toggleExpand = async (catName) => {
    if (expanded === catName) {
      setExpanded(null);
      return;
    }
    setExpanded(catName);
    const { rangeFrom, rangeTo } = useReportStore.getState();
    const rows = await window.electronAPI.getReportProductsInCategory(
      rangeFrom,
      rangeTo,
      catName
    );
    setDetailRows((d) => ({ ...d, [catName]: rows || [] }));
  };

  const applyCustom = () => {
    const a = new Date(customA + 'T00:00:00');
    const b = new Date(customB + 'T00:00:00');
    setCustomRange(a, b);
    fetchAll();
  };

  const exportCsv = async () => {
    const lines = [];
    lines.push('Bar POS — Exportación de reportes');
    lines.push(`Rango,${useReportStore.getState().rangeFrom},${useReportStore.getState().rangeTo}`);
    lines.push('');
    lines.push('Resumen');
    lines.push(
      ['Total ventas', 'Tickets', 'Promedio', 'Método top']
        .map(escapeCsv)
        .join(',')
    );
    lines.push(
      [
        summary?.totalSales ?? 0,
        summary?.ticketCount ?? 0,
        summary?.avgTicket ?? 0,
        summary?.topPaymentMethod ?? '',
      ]
        .map(escapeCsv)
        .join(',')
    );
    lines.push('');
    lines.push('Por categoría');
    lines.push(
      ['Categoría', 'Cantidad items', 'Total', '% del total'].map(escapeCsv).join(',')
    );
    (byCategory || []).forEach((r) => {
      lines.push(
        [
          r.category,
          r.quantity,
          r.total,
          pct(r.total, grandCatTotal),
        ]
          .map(escapeCsv)
          .join(',')
      );
    });
    lines.push('');
    lines.push('Por producto');
    lines.push(
      ['Producto', 'Categoría', 'Cantidad', 'Precio unit. prom.', 'Total']
        .map(escapeCsv)
        .join(',')
    );
    (byProduct || []).forEach((r) => {
      lines.push(
        [r.product, r.category, r.qty, r.unit_price, r.total]
          .map(escapeCsv)
          .join(',')
      );
    });
    lines.push('');
    lines.push('Por mesa');
    lines.push(['Mesa', 'Tickets', 'Total'].map(escapeCsv).join(','));
    (byTable || []).forEach((r) => {
      lines.push([r.table_name, r.tickets, r.total].map(escapeCsv).join(','));
    });

    const name = `reporte-barpos-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;
    const res = await window.electronAPI.exportCSV(lines.join('\n'), name);
    if (res?.error) toast.error(res.error);
    else if (!res?.canceled) toast.success('CSV exportado');
  };

  const categoryNames = ['', ...new Set((byCategory || []).map((c) => c.category))];

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950">
      <Navbar
        title="Reportes"
        right={
          <>
            <button
              type="button"
              onClick={exportCsv}
              className="flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-4 font-semibold hover:bg-emerald-600"
            >
              <FileDown className="h-5 w-5" />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex min-h-[48px] items-center gap-2 rounded-xl bg-slate-800 px-4 font-semibold hover:bg-slate-700"
            >
              <ArrowLeft className="h-5 w-5" />
              Mesas
            </button>
          </>
        }
      />

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'today', label: 'Hoy' },
              { id: 'week', label: 'Esta semana' },
              { id: 'month', label: 'Este mes' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setExpanded(null);
                  setPreset(p.id);
                  fetchAll();
                }}
                className={`min-h-[48px] rounded-xl px-4 font-semibold ${
                  preset === p.id ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-l border-slate-700 pl-4">
            <span className="text-sm text-slate-400">Personalizado</span>
            <input
              type="date"
              className="min-h-[44px] rounded-lg border border-slate-600 bg-slate-800 px-2"
              value={customA}
              onChange={(e) => setCustomA(e.target.value)}
            />
            <input
              type="date"
              className="min-h-[44px] rounded-lg border border-slate-600 bg-slate-800 px-2"
              value={customB}
              onChange={(e) => setCustomB(e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                setExpanded(null);
                applyCustom();
              }}
              className="min-h-[48px] rounded-xl bg-slate-700 px-4 font-semibold hover:bg-slate-600"
            >
              Aplicar
            </button>
          </div>
          {loading && <span className="text-sm text-slate-500">Actualizando…</span>}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total ventas', v: formatMoney(summary?.totalSales ?? 0) },
            { label: 'Número de tickets', v: summary?.ticketCount ?? 0 },
            { label: 'Promedio por ticket', v: formatMoney(summary?.avgTicket ?? 0) },
            { label: 'Método más usado', v: summary?.topPaymentMethod ?? '—' },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow"
            >
              <div className="text-sm text-slate-400">{c.label}</div>
              <div className="mt-1 text-2xl font-bold text-white">{c.v}</div>
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-200">Por categoría</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Cantidad ítems</th>
                  <th className="p-3">Total vendido</th>
                  <th className="p-3">% del total</th>
                </tr>
              </thead>
              <tbody>
                {(byCategory || []).map((r) => (
                  <React.Fragment key={r.category}>
                    <tr
                      className="cursor-pointer border-t border-slate-700 hover:brightness-110"
                      style={{ backgroundColor: `${r.color}33` }}
                      onClick={() => toggleExpand(r.category)}
                    >
                      <td className="p-3 font-medium">{r.category}</td>
                      <td className="p-3">{r.quantity}</td>
                      <td className="p-3 font-semibold">{formatMoney(r.total)}</td>
                      <td className="p-3">{pct(r.total, grandCatTotal)}%</td>
                    </tr>
                    {expanded === r.category && (
                      <tr className="bg-slate-900/90">
                        <td colSpan={4} className="p-3 pl-8">
                          <div className="text-xs font-semibold uppercase text-slate-500">
                            Productos
                          </div>
                          <ul className="mt-2 space-y-1">
                            {(detailRows[r.category] || []).map((d) => (
                              <li
                                key={d.name}
                                className="flex justify-between gap-4 text-slate-300"
                              >
                                <span>{d.name}</span>
                                <span>
                                  {d.qty} · {formatMoney(d.total)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-200">Por producto</h2>
            <select
              className="min-h-[48px] rounded-xl border border-slate-600 bg-slate-800 px-3"
              value={productCategoryFilter}
              onChange={(e) => {
                setProductCategoryFilter(e.target.value);
                fetchAll();
              }}
            >
              {categoryNames.map((n) => (
                <option key={n || 'all'} value={n}>
                  {n || 'Todas las categorías'}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Cantidad</th>
                  <th className="p-3">Precio unitario</th>
                  <th className="p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {(byProduct || []).map((r) => (
                  <tr key={`${r.product}-${r.category}`} className="border-t border-slate-700">
                    <td className="p-3">{r.product}</td>
                    <td className="p-3 text-slate-400">{r.category}</td>
                    <td className="p-3">{r.qty}</td>
                    <td className="p-3">{formatMoney(r.unit_price)}</td>
                    <td className="p-3 font-semibold">{formatMoney(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-200">Por mesa</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="p-3">Mesa</th>
                  <th className="p-3"># Tickets</th>
                  <th className="p-3">Total generado</th>
                </tr>
              </thead>
              <tbody>
                {(byTable || []).map((r) => (
                  <tr key={r.table_name} className="border-t border-slate-700">
                    <td className="p-3 font-medium">{r.table_name}</td>
                    <td className="p-3">{r.tickets}</td>
                    <td className="p-3 font-semibold">{formatMoney(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
