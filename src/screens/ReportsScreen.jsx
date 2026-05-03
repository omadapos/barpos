import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { ArrowLeft, FileDown, CalendarDays } from 'lucide-react';
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

  useEffect(() => { setPreset('today'); fetchAll(); }, []);

  const grandCatTotal = (byCategory || []).reduce((a, r) => a + (r.total || 0), 0);

  const toggleExpand = async (catName) => {
    if (expanded === catName) { setExpanded(null); return; }
    setExpanded(catName);
    const { rangeFrom, rangeTo } = useReportStore.getState();
    const rows = await window.electronAPI.getReportProductsInCategory(rangeFrom, rangeTo, catName);
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
    lines.push(['Total ventas', 'Tickets', 'Promedio', 'Método top'].map(escapeCsv).join(','));
    lines.push([summary?.totalSales ?? 0, summary?.ticketCount ?? 0, summary?.avgTicket ?? 0, summary?.topPaymentMethod ?? ''].map(escapeCsv).join(','));
    lines.push('');
    lines.push('Por categoría');
    lines.push(['Categoría', 'Cantidad items', 'Total', '% del total'].map(escapeCsv).join(','));
    (byCategory || []).forEach((r) => {
      lines.push([r.category, r.quantity, r.total, pct(r.total, grandCatTotal)].map(escapeCsv).join(','));
    });
    lines.push('');
    lines.push('Por producto');
    lines.push(['Producto', 'Categoría', 'Cantidad', 'Precio unit. prom.', 'Total'].map(escapeCsv).join(','));
    (byProduct || []).forEach((r) => {
      lines.push([r.product, r.category, r.qty, r.unit_price, r.total].map(escapeCsv).join(','));
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

  const presetButtons = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Esta semana' },
    { id: 'month', label: 'Este mes' },
  ];

  const summaryCards = [
    { label: 'Total ventas', v: formatMoney(summary?.totalSales ?? 0) },
    { label: 'Número de tickets', v: summary?.ticketCount ?? 0 },
    { label: 'Promedio por ticket', v: formatMoney(summary?.avgTicket ?? 0) },
    { label: 'Método más usado', v: summary?.topPaymentMethod ?? '—' },
  ];

  const thSx = { fontWeight: 800, color: 'text.primary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: 'background.default' }}>
      <Navbar
        title="Reportes"
        right={
          <>
            <Button variant="contained" color="success" onClick={exportCsv} startIcon={<FileDown size={18} />}
              sx={{ borderRadius: 3, py: 1.2, fontWeight: 800 }}>
              Exportar CSV
            </Button>
            <Button variant="outlined" color="inherit" onClick={onBack} startIcon={<ArrowLeft size={18} />}
              sx={{ borderRadius: 3, py: 1.2, fontWeight: 800, borderColor: 'divider', color: 'text.secondary' }}>
              Mesas
            </Button>
          </>
        }
      />

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 3, md: 5 } }}>
        <Stack spacing={4} sx={{ maxWidth: 1200, mx: 'auto' }}>

          {/* Filters */}
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {presetButtons.map((p) => (
                <Button key={p.id} variant={preset === p.id ? 'contained' : 'outlined'}
                  color={preset === p.id ? 'primary' : 'inherit'}
                  onClick={() => { setExpanded(null); setPreset(p.id); fetchAll(); }}
                  sx={{ borderRadius: 3, py: 1.2, fontWeight: 800, borderColor: preset === p.id ? undefined : 'divider' }}>
                  {p.label}
                </Button>
              ))}
              <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 2 }}>
                <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <CalendarDays size={18} color="#64748b" />
                  <TextField type="date" size="small" value={customA} onChange={(e) => setCustomA(e.target.value)}
                    slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }} />
                  <TextField type="date" size="small" value={customB} onChange={(e) => setCustomB(e.target.value)}
                    slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }} />
                  <Button variant="outlined" color="inherit"
                    onClick={() => { setExpanded(null); applyCustom(); }}
                    sx={{ borderRadius: 3, py: 1, fontWeight: 800, borderColor: 'divider' }}>
                    Aplicar
                  </Button>
                </Stack>
              </Box>
              {loading && <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Actualizando…</Typography>}
            </Stack>
          </Paper>

          {/* Summary Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', xl: 'repeat(4, 1fr)' }, gap: 2.5 }}>
            {summaryCards.map((c) => (
              <Paper key={c.label} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>{c.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>{c.v}</Typography>
              </Paper>
            ))}
          </Box>

          {/* By Category Table */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Por categoría</Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={thSx}>Categoría</TableCell>
                    <TableCell sx={thSx}>Cantidad ítems</TableCell>
                    <TableCell sx={thSx}>Total vendido</TableCell>
                    <TableCell sx={thSx}>% del total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(byCategory || []).map((r) => (
                    <React.Fragment key={r.category}>
                      <TableRow hover onClick={() => toggleExpand(r.category)}
                        sx={{ cursor: 'pointer', bgcolor: `${r.color}0D` }}>
                        <TableCell sx={{ fontWeight: 700 }}>{r.category}</TableCell>
                        <TableCell>{r.quantity}</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>{formatMoney(r.total)}</TableCell>
                        <TableCell>{pct(r.total, grandCatTotal)}%</TableCell>
                      </TableRow>
                      {expanded === r.category && (
                        <TableRow>
                          <TableCell colSpan={4} sx={{ pl: 6, py: 2, bgcolor: '#fafbfc' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.05em' }}>
                              Productos
                            </Typography>
                            <Stack spacing={0.5} sx={{ mt: 1 }}>
                              {(detailRows[r.category] || []).map((d) => (
                                <Stack key={d.name} direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
                                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>{d.name}</Typography>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    {d.qty} · {formatMoney(d.total)}
                                  </Typography>
                                </Stack>
                              ))}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* By Product Table */}
          <Box>
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Por producto</Typography>
              <TextField select size="small" value={productCategoryFilter}
                onChange={(e) => { setProductCategoryFilter(e.target.value); fetchAll(); }}
                slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700, minWidth: 200 } } }}>
                {categoryNames.map((n) => (
                  <MenuItem key={n || 'all'} value={n}>{n || 'Todas las categorías'}</MenuItem>
                ))}
              </TextField>
            </Stack>
            <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={thSx}>Producto</TableCell>
                    <TableCell sx={thSx}>Categoría</TableCell>
                    <TableCell sx={thSx}>Cantidad</TableCell>
                    <TableCell sx={thSx}>Precio unitario</TableCell>
                    <TableCell sx={thSx}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(byProduct || []).map((r) => (
                    <TableRow key={`${r.product}-${r.category}`} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{r.product}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{r.category}</TableCell>
                      <TableCell>{r.qty}</TableCell>
                      <TableCell>{formatMoney(r.unit_price)}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{formatMoney(r.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* By Table */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Por mesa</Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={thSx}>Mesa</TableCell>
                    <TableCell sx={thSx}># Tickets</TableCell>
                    <TableCell sx={thSx}>Total generado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(byTable || []).map((r) => (
                    <TableRow key={r.table_name} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{r.table_name}</TableCell>
                      <TableCell>{r.tickets}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{formatMoney(r.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
