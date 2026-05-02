import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfDay, startOfWeek, startOfMonth, format } from 'date-fns';
import toast from 'react-hot-toast';
import { Printer } from 'lucide-react';
import Spinner from '@/components/Spinner';
import { reportsApi } from '@/api/reports.api';
import type { CategoryReport, ProductReport } from '@/types';
import { formatMoney } from '@/lib/format';
import { buildReportPrintPayload } from '@/lib/buildReportPrintPayload';
import { loadThermalSettings, toElectronPrintConfig } from '@/lib/thermalPrinterConfig';

type Preset = 'today' | 'week' | 'month' | 'custom';

function reportRange(from: Date, to: Date) {
  const a = startOfDay(from <= to ? from : to);
  const b = startOfDay(from <= to ? to : from);
  return {
    from: format(a, 'yyyy-MM-dd'),
    to: format(b, 'yyyy-MM-dd'),
  };
}

export default function ReportsScreen() {
  const [preset, setPreset] = useState<Preset>('today');
  const [customA, setCustomA] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customB, setCustomB] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const { from, to } = useMemo(() => {
    const now = new Date();
    if (preset === 'week') {
      return reportRange(startOfWeek(now, { weekStartsOn: 1 }), now);
    }
    if (preset === 'month') {
      return reportRange(startOfMonth(now), now);
    }
    if (preset === 'custom') {
      const a = new Date(customA + 'T12:00:00');
      const b = new Date(customB + 'T12:00:00');
      return reportRange(a, b);
    }
    return reportRange(now, now);
  }, [preset, customA, customB]);

  const summaryQuery = useQuery({
    queryKey: ['reports', 'summary', from, to],
    queryFn: () => reportsApi.getSummary(from, to),
  });

  const catQuery = useQuery({
    queryKey: ['reports', 'category', from, to],
    queryFn: () => reportsApi.getByCategory(from, to),
  });

  const prodQuery = useQuery({
    queryKey: ['reports', 'product', from, to],
    queryFn: () => reportsApi.getByProduct(from, to),
  });

  const tableQuery = useQuery({
    queryKey: ['reports', 'table', from, to],
    queryFn: () => reportsApi.getByTable(from, to),
  });

  const loading =
    summaryQuery.isLoading ||
    catQuery.isLoading ||
    prodQuery.isLoading ||
    tableQuery.isLoading;

  const categories: CategoryReport[] = catQuery.data ?? [];
  const products: ProductReport[] = prodQuery.data ?? [];

  const grandTotal = useMemo(
    () => categories.reduce((s, c) => s + (c.total || 0), 0),
    [categories]
  );

  const pct = (row: CategoryReport) => {
    if (!grandTotal) return '0.0';
    return ((row.total / grandTotal) * 100).toFixed(1);
  };

  const productsForCategory = (name: string) =>
    products.filter((p) => p.categoryName === name);

  const summary = summaryQuery.data;

  useEffect(() => {
    setExpanded(null);
  }, [from, to]);

  const handlePrintReport = useCallback(async () => {
    const printApi = window.electronEnv?.printThermalReceipt;
    if (!printApi) {
      toast.error('Impresión POS solo en la app de escritorio Bar POS (.exe).');
      return;
    }
    if (loading) {
      toast.error('Espera a que carguen los reportes.');
      return;
    }
    const err =
      summaryQuery.error || catQuery.error || prodQuery.error || tableQuery.error;
    if (err) {
      toast.error('No se puede imprimir: hay un error al cargar datos.');
      return;
    }
    setPrinting(true);
    try {
      const settings = loadThermalSettings();
      const cats = catQuery.data ?? [];
      const prods = prodQuery.data ?? [];
      const tabs = tableQuery.data ?? [];
      const payload = buildReportPrintPayload(
        settings,
        from,
        to,
        summaryQuery.data,
        cats,
        prods,
        tabs
      );
      const result = await printApi({
        config: toElectronPrintConfig(settings) as Record<string, unknown>,
        payload: { ...payload } as Record<string, unknown>,
      });
      if (result.ok) toast.success('Reporte enviado a la impresora');
      else toast.error(result.error || 'No se pudo imprimir');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al imprimir');
    } finally {
      setPrinting(false);
    }
  }, [
    loading,
    summaryQuery.error,
    summaryQuery.data,
    catQuery.error,
    catQuery.data,
    prodQuery.error,
    prodQuery.data,
    tableQuery.error,
    tableQuery.data,
    from,
    to,
  ]);

  const tabBtn = (id: Preset, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setPreset(id)}
      className={`app-no-drag min-h-[44px] rounded-[var(--radius)] px-3 text-xs font-bold sm:px-4 sm:text-sm ${
        preset === id
          ? 'border border-[var(--green2)] bg-[var(--green-dim)] text-[var(--green)]'
          : 'border border-[var(--border)] bg-[var(--bg3)] text-[var(--text3)] hover:border-[var(--border2)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg)]">
      <div className="shrink-0 border-b border-[var(--border)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-[var(--text)]">Reportes</h1>
          <button
            type="button"
            onClick={() => void handlePrintReport()}
            disabled={printing || loading}
            className="app-no-drag flex min-h-[44px] items-center gap-2 rounded-[var(--radius)] border border-[var(--border2)] bg-[var(--bg3)] px-4 text-sm font-bold text-[var(--text)] transition hover:border-[var(--green)] hover:bg-[var(--green-dim)] hover:text-[var(--green)] disabled:opacity-50"
          >
            <Printer className="h-5 w-5 shrink-0" />
            {printing ? 'Imprimiendo…' : 'Imprimir en impresora POS'}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 scrollbar-emerald md:p-6">
        <div className="flex flex-wrap items-end gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg2)] p-3 md:gap-3 md:p-4">
          {tabBtn('today', 'HOY')}
          {tabBtn('week', 'SEMANA')}
          {tabBtn('month', 'MES')}
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
            <span className="text-xs text-[var(--text3)]">Custom</span>
            <input
              type="date"
              className="app-no-drag min-h-[44px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] px-2 text-sm text-[var(--text)]"
              value={customA}
              onChange={(e) => {
                setCustomA(e.target.value);
                setPreset('custom');
              }}
            />
            <span className="text-[var(--text3)]">—</span>
            <input
              type="date"
              className="app-no-drag min-h-[44px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] px-2 text-sm text-[var(--text)]"
              value={customB}
              onChange={(e) => {
                setCustomB(e.target.value);
                setPreset('custom');
              }}
            />
          </div>
          {loading && <Spinner className="h-6 w-6" />}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Ventas', v: formatMoney(summary?.totalSales ?? 0) },
            { label: 'Tickets', v: String(summary?.totalTickets ?? 0) },
            { label: 'Promedio', v: formatMoney(summary?.avgTicket ?? 0) },
            { label: 'Más usado', v: summary?.topPaymentMethod ?? '—' },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg3)] p-4"
            >
              <div className="text-xs font-medium text-[var(--text3)]">{c.label}</div>
              <div className="mt-1 text-2xl font-bold text-[var(--green)]">{c.v}</div>
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--text2)]">
            Por categoría
          </h2>
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)]">
                <tr>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">%</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((r, idx) => {
                  const pNum = r.percentage ?? parseFloat(pct(r));
                  const bar = Math.min(100, Number.isFinite(pNum) ? pNum : 0);
                  const stripe = idx % 2 === 0 ? 'var(--bg2)' : 'var(--bg3)';
                  return (
                    <Fragment key={r.categoryName}>
                      <tr
                        className="cursor-pointer border-t border-[var(--border)] transition hover:bg-[var(--bg4)]"
                        style={{ backgroundColor: stripe }}
                        onClick={() =>
                          setExpanded((e) => (e === r.categoryName ? null : r.categoryName))
                        }
                      >
                        <td className="p-3 font-medium text-[var(--text)]">{r.categoryName}</td>
                        <td className="p-3 text-[var(--text2)]">{r.itemsSold}</td>
                        <td className="p-3 font-semibold text-[var(--green)]">
                          {formatMoney(r.total)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-28 overflow-hidden rounded bg-[var(--border)]">
                              <div
                                className="h-full rounded bg-[var(--green2)] transition-all"
                                style={{ width: `${bar}%` }}
                              />
                            </div>
                            <span className="text-[var(--text2)]">{pct(r)}%</span>
                          </div>
                        </td>
                      </tr>
                      {expanded === r.categoryName && (
                        <tr className="bg-[var(--bg)]">
                          <td colSpan={4} className="p-3 pl-8">
                            <div className="text-[10px] font-bold uppercase text-[var(--text3)]">
                              Productos
                            </div>
                            <ul className="mt-2 space-y-1">
                              {productsForCategory(r.categoryName).map((d) => (
                                <li
                                  key={d.productName}
                                  className="flex justify-between gap-4 text-[var(--text2)]"
                                >
                                  <span>{d.productName}</span>
                                  <span>
                                    {d.itemsSold} · {formatMoney(d.total)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--text2)]">
            Por producto
          </h2>
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)]">
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Cantidad</th>
                  <th className="p-3">P. unit.</th>
                  <th className="p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {products.map((r, i) => (
                  <tr
                    key={`${r.productName}-${r.categoryName}`}
                    className="border-t border-[var(--border)] transition hover:bg-[var(--bg4)]"
                    style={{ backgroundColor: i % 2 === 0 ? 'var(--bg2)' : 'var(--bg3)' }}
                  >
                    <td className="p-3 text-[var(--text)]">{r.productName}</td>
                    <td className="p-3 text-[var(--text3)]">{r.categoryName}</td>
                    <td className="p-3 text-[var(--text2)]">{r.itemsSold}</td>
                    <td className="p-3 text-[var(--text2)]">
                      {formatMoney(
                        r.unitPrice ?? (r.itemsSold > 0 ? r.total / r.itemsSold : 0)
                      )}
                    </td>
                    <td className="p-3 font-semibold text-[var(--green)]">
                      {formatMoney(r.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--text2)]">
            Por mesa
          </h2>
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)]">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--bg2)] text-[var(--text2)]">
                <tr>
                  <th className="p-3">Mesa</th>
                  <th className="p-3">Tickets</th>
                  <th className="p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {(tableQuery.data ?? []).map((r, i) => (
                  <tr
                    key={r.tableName}
                    className="border-t border-[var(--border)] transition hover:bg-[var(--bg4)]"
                    style={{ backgroundColor: i % 2 === 0 ? 'var(--bg2)' : 'var(--bg3)' }}
                  >
                    <td className="p-3 font-medium text-[var(--text)]">{r.tableName}</td>
                    <td className="p-3 text-[var(--text2)]">{r.ticketCount}</td>
                    <td className="p-3 font-semibold text-[var(--green)]">
                      {formatMoney(r.total)}
                    </td>
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
