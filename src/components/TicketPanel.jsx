import React, { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { Minus, Plus, X, ShoppingCart, CreditCard, Trash2 } from 'lucide-react';
import { formatMoney } from '@/lib/format';

function LineRow({ item, onQty, onRemove }) {
  const startX = useRef(null);
  const [offset, setOffset] = useState(0);

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchMove = (e) => {
    if (startX.current == null) return;
    setOffset(Math.min(0, e.touches[0].clientX - startX.current));
  };
  const onTouchEnd = () => {
    if (offset < -80) onRemove(item.id);
    setOffset(0);
    startX.current = null;
  };

  return (
    <Box
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      sx={{ position: 'relative', overflow: 'hidden', borderRadius: 3, border: '1px solid',
        borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
    >
      <Box sx={{ p: 2, transition: 'transform 0.2s ease', transform: `translateX(${offset}px)` }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9rem' }}>{item.product_name}</Typography>
          <IconButton size="small" onClick={() => onRemove(item.id)}
            sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' } }}>
            <X size={16} color="#ef4444" />
          </IconButton>
        </Stack>

        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 0.75 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>P. unit. {formatMoney(item.unit_price)}</Typography>
          <Typography sx={{ fontWeight: 800, color: 'success.main', fontSize: '0.95rem' }}>{formatMoney(item.subtotal)}</Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center', alignItems: 'center', mt: 1.5 }}>
          <IconButton onClick={() => onQty(item.id, item.quantity - 1)}
            sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: '#f1f5f9', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: '#e2e8f0' } }}>
            <Minus size={18} color="#475569" />
          </IconButton>
          <Typography sx={{ minWidth: 32, textAlign: 'center', fontSize: '1.15rem', fontWeight: 900 }}>{item.quantity}</Typography>
          <IconButton onClick={() => onQty(item.id, item.quantity + 1)}
            sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: '#f1f5f9', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: '#e2e8f0' } }}>
            <Plus size={18} color="#475569" />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
}

export default function TicketPanel({
  title, items, subtotal, tax, total, taxPercent, onQuantity, onRemove, onCancelOrder, onPay,
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
      borderLeft: '1px solid', borderColor: 'divider', bgcolor: '#fafbfc' }}>
      {/* Header */}
      <Box sx={{ flexShrink: 0, px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <ShoppingCart size={20} color="#6366f1" />
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary' }}>{title}</Typography>
        </Stack>
      </Box>

      {/* Items */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2.5, py: 2 }}>
        <Stack spacing={1.5}>
          {(items || []).length === 0 && (
            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', py: 4, fontWeight: 500 }}>Sin artículos aún</Typography>
          )}
          {(items || []).map((it) => (
            <LineRow key={it.id} item={it} onQty={onQuantity} onRemove={onRemove} />
          ))}
        </Stack>
      </Box>

      {/* Totals & Actions */}
      <Box sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
        px: 3, py: 2.5, boxShadow: '0 -2px 8px rgba(15,23,42,0.04)' }}>
        <Stack spacing={0.75} sx={{ mb: 1.5 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Subtotal</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{formatMoney(subtotal)}</Typography>
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Impuesto ({taxPercent}%)</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{formatMoney(tax)}</Typography>
          </Stack>
          <Divider sx={{ my: 0.5 }} />
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '1.35rem', fontWeight: 900, color: 'text.primary' }}>Total</Typography>
            <Typography sx={{ fontSize: '1.35rem', fontWeight: 900, color: 'text.primary' }}>{formatMoney(total)}</Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button fullWidth variant="outlined" color="inherit" onClick={onCancelOrder} startIcon={<Trash2 size={18} />}
            sx={{ borderRadius: 3, py: 1.5, fontWeight: 800, borderColor: 'divider', color: 'text.secondary',
              '&:hover': { borderColor: 'error.light', color: 'error.main', bgcolor: 'rgba(239,68,68,0.04)' } }}>
            Cancelar
          </Button>
          <Button fullWidth variant="contained" color="success" onClick={onPay} disabled={!items?.length}
            startIcon={<CreditCard size={18} />} sx={{ borderRadius: 3, py: 1.5, fontWeight: 800, flex: 2 }}>
            Cobrar
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
