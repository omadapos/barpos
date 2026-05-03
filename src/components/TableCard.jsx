import React, { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import { Users } from 'lucide-react';
import { formatMoney } from '@/lib/format';

export default function TableCard({
  table, occupied, itemCount, total, onOpen, onViewOrder,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimer = useRef(null);

  const clearTimer = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const openMenu = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(true); }, []);
  const onPointerDown = () => { clearTimer(); longPressTimer.current = setTimeout(() => setMenuOpen(true), 600); };
  const onPointerUp = () => clearTimer();

  return (
    <Box sx={{ position: 'relative' }}>
      <ButtonBase
        onClick={() => onOpen()}
        onContextMenu={openMenu}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        sx={{
          width: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', alignItems: 'stretch', textAlign: 'left',
          minHeight: 110, p: 2.5, borderRadius: 4,
          border: '2px solid',
          borderColor: occupied ? 'warning.light' : 'success.light',
          bgcolor: occupied ? 'rgba(251, 191, 36, 0.08)' : 'rgba(16, 185, 129, 0.06)',
          boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
          transition: 'all 0.2s ease', cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: occupied
              ? '0 6px 20px rgba(245, 158, 11, 0.15)'
              : '0 6px 20px rgba(16, 185, 129, 0.12)',
          },
          '&:active': { transform: 'scale(0.98)' },
        }}
      >
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.1rem' }}>
            {table.name}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
            <Users size={16} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>{table.capacity}</Typography>
          </Stack>
        </Stack>

        {occupied ? (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ color: 'warning.dark', fontWeight: 600 }}>{itemCount ?? 0} artículos</Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.25 }}>{formatMoney(total)}</Typography>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 700, color: 'success.main' }}>Disponible</Typography>
        )}
      </ButtonBase>

      {menuOpen && (
        <>
          <Box
            onClick={() => setMenuOpen(false)}
            sx={{ position: 'fixed', inset: 0, zIndex: 40, bgcolor: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(2px)' }}
          />
          <Paper elevation={8} sx={{
            position: 'absolute', right: 0, top: '100%', zIndex: 50, mt: 0.5,
            minWidth: 200, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
          }}>
            <ButtonBase
              onClick={() => { setMenuOpen(false); onViewOrder(); }}
              sx={{ display: 'block', width: '100%', px: 2.5, py: 1.5, textAlign: 'left',
                fontSize: '0.9rem', fontWeight: 600, color: 'text.primary', '&:hover': { bgcolor: 'action.hover' } }}
            >
              Ver orden
            </ButtonBase>
            <ButtonBase
              onClick={() => { setMenuOpen(false); toast('Transferencia de mesa disponible en versión 2'); }}
              sx={{ display: 'block', width: '100%', px: 2.5, py: 1.5, textAlign: 'left',
                fontSize: '0.9rem', fontWeight: 500, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
            >
              Transferir mesa (v2)
            </ButtonBase>
          </Paper>
        </>
      )}
    </Box>
  );
}
