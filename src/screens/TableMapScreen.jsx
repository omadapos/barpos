import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { BarChart3, Settings2, Armchair, Ticket, LogOut } from 'lucide-react';
import Navbar from '@/components/Navbar.jsx';
import TableCard from '@/components/TableCard.jsx';
import TableManagerModal from '@/components/TableManagerModal.jsx';
import TaxSettingsModal from '@/components/TaxSettingsModal.jsx';
import { useTableStore } from '@/store/useTableStore';
import { useOrderStore } from '@/store/useOrderStore';

export default function TableMapScreen({ onOpenOrder, onReports, onLogout }) {
  const { tables, openOrders, openOrdersList, refreshAll } = useTableStore();
  const clearLocalOrder = useOrderStore((s) => s.clearLocalOrder);
  const [managerOpen, setManagerOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(false);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const activeTables = (tables || []).filter((t) => t.active);

  const metaForTable = (tableId) => {
    const o = (openOrdersList || []).find(
      (x) => x.table_id === tableId && x.status === 'open'
    );
    return o ? { orderId: o.id, itemCount: o.item_count, total: o.total } : null;
  };

  const openTable = async (table) => {
    clearLocalOrder();
    const m = metaForTable(table.id);
    await onOpenOrder({
      tableId: table.id,
      tableName: table.name,
      orderId: m?.orderId,
    });
  };

  const viewOrder = async (table) => {
    const m = metaForTable(table.id);
    if (!m?.orderId) return;
    clearLocalOrder();
    await onOpenOrder({
      tableId: table.id,
      tableName: table.name,
      orderId: m.orderId,
    });
  };

  const walkIn = async () => {
    clearLocalOrder();
    await onOpenOrder({ tableId: null, tableName: null, orderId: null });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: 'background.default' }}>
      <Navbar
        title="Bar POS"
        right={
          <>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setTaxOpen(true)}
              startIcon={<Settings2 size={18} />}
              sx={{
                borderRadius: 3,
                py: 1.2,
                fontWeight: 800,
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.light',
                  bgcolor: 'rgba(99, 102, 241, 0.04)',
                },
              }}
            >
              Impuesto
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={onReports}
              startIcon={<BarChart3 size={18} />}
              sx={{
                borderRadius: 3,
                py: 1.2,
                fontWeight: 800,
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.light',
                  bgcolor: 'rgba(99, 102, 241, 0.04)',
                },
              }}
            >
              Reportes
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setManagerOpen(true)}
              startIcon={<Armchair size={18} />}
              sx={{ borderRadius: 3, py: 1.2, fontWeight: 800 }}
            >
              Gestionar mesas
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={onLogout}
              startIcon={<LogOut size={18} />}
              sx={{
                borderRadius: 3,
                py: 1.2,
                fontWeight: 800,
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.06)',
                },
              }}
            >
              Salir
            </Button>
          </>
        }
      />

      {/* Table Grid */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 3, md: 5 } }}>
        <Box
          sx={{
            mx: 'auto',
            maxWidth: 1200,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 2.5,
          }}
        >
          {activeTables.map((t) => {
            const occ = !!openOrders[t.id];
            const m = metaForTable(t.id);
            return (
              <TableCard
                key={t.id}
                table={t}
                occupied={occ}
                itemCount={m?.itemCount}
                total={m?.total}
                onOpen={() => openTable(t)}
                onViewOrder={() => viewOrder(t)}
              />
            );
          })}
        </Box>
      </Box>

      {/* Walk-in Button */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          p: 3,
          boxShadow: '0 -2px 8px rgba(15,23,42,0.04)',
        }}
      >
        <Box sx={{ mx: 'auto', maxWidth: 1200 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={walkIn}
            startIcon={<Ticket size={22} />}
            sx={{
              borderRadius: 4,
              py: 2.5,
              fontWeight: 900,
              fontSize: '1.15rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                boxShadow: '0 6px 24px rgba(139, 92, 246, 0.35)',
              },
            }}
          >
            Ticket directo
          </Button>
        </Box>
      </Box>

      <TableManagerModal open={managerOpen} onClose={() => setManagerOpen(false)} />
      <TaxSettingsModal open={taxOpen} onClose={() => setTaxOpen(false)} />
    </Box>
  );
}
