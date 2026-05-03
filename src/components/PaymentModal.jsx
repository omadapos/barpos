import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { X, Banknote, CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';
import { formatMoney } from '@/lib/format';

export default function PaymentModal({ open, total, onClose, onConfirm }) {
  const [method, setMethod] = useState(null);
  const [tendered, setTendered] = useState('');

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) {
        setMethod(null);
        setTendered('');
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setMethod(null);
      setTendered('');
    }
  }, [open]);

  if (!open) return null;

  const totalNum = Number(total) || 0;
  const tenderedNum = parseFloat(String(tendered).replace(/,/g, '')) || 0;
  const change = Math.max(0, tenderedNum - totalNum);

  const confirm = () => {
    if (method === 'cash' && tenderedNum < totalNum) return;
    if (method) onConfirm(method, { tendered: tenderedNum, change });
  };

  return (
    <Box
      onClick={() => { setMethod(null); onClose(); }}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1350,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        p: 2,
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: '100%',
          maxWidth: 440,
          bgcolor: 'background.paper',
          borderRadius: 4,
          boxShadow: 24,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            bgcolor: 'success.light',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Cobrar
          </Typography>
          <IconButton
            onClick={() => { setMethod(null); onClose(); }}
            sx={{ color: 'white' }}
          >
            <X size={24} />
          </IconButton>
        </Box>

        <Box sx={{ p: 4 }}>
          {/* Total Display */}
          <Typography
            variant="h4"
            sx={{
              textAlign: 'center',
              fontWeight: 900,
              color: 'success.main',
              mb: 3,
            }}
          >
            {formatMoney(totalNum)}
          </Typography>

          {/* Method Selection */}
          {!method && (
            <Stack spacing={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setMethod('cash')}
                startIcon={<Banknote size={22} />}
                sx={{
                  borderRadius: 3,
                  py: 2,
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  bgcolor: 'warning.dark',
                  '&:hover': { bgcolor: 'warning.main' },
                }}
              >
                Efectivo
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => setMethod('card')}
                startIcon={<CreditCard size={22} />}
                sx={{
                  borderRadius: 3,
                  py: 2,
                  fontWeight: 800,
                  fontSize: '1.1rem',
                }}
              >
                Tarjeta
              </Button>
            </Stack>
          )}

          {/* Cash Flow */}
          {method === 'cash' && (
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Monto recibido"
                placeholder="0.00"
                type="number"
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
                autoFocus
                slotProps={{
                  input: {
                    sx: { fontWeight: 800, fontSize: '1.25rem', borderRadius: 3 },
                    inputMode: 'decimal',
                  },
                }}
              />

              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid',
                  borderColor: 'success.light',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Cambio</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main' }}>
                  {formatMoney(change)}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={confirm}
                disabled={tenderedNum < totalNum}
                startIcon={<CheckCircle size={20} />}
                sx={{ borderRadius: 3, py: 1.5, fontWeight: 800 }}
              >
                Confirmar cobro
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                onClick={() => setMethod(null)}
                startIcon={<ArrowLeft size={18} />}
                sx={{ borderRadius: 3, py: 1.5, fontWeight: 800, borderColor: 'divider' }}
              >
                Volver
              </Button>
            </Stack>
          )}

          {/* Card Flow */}
          {method === 'card' && (
            <Stack spacing={3}>
              <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 500 }}>
                Cobro con tarjeta por el total indicado.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={confirm}
                startIcon={<CheckCircle size={20} />}
                sx={{ borderRadius: 3, py: 1.5, fontWeight: 800 }}
              >
                Confirmar cobro
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                onClick={() => setMethod(null)}
                startIcon={<ArrowLeft size={18} />}
                sx={{ borderRadius: 3, py: 1.5, fontWeight: 800, borderColor: 'divider' }}
              >
                Volver
              </Button>
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
