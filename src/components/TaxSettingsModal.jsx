import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import { X, Save, Settings } from 'lucide-react';
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
    const onKey = (e) => { if (e.key === 'Escape' && open) onClose(); };
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
    <Box
      onClick={onClose}
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
          maxWidth: 380,
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
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Settings size={22} />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Impuesto (%)
            </Typography>
          </Stack>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <X size={24} />
          </IconButton>
        </Box>

        {/* Form */}
        <Box sx={{ p: 4 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              type="number"
              label="Porcentaje de impuesto"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              autoFocus
              slotProps={{
                input: {
                  sx: { fontWeight: 800, fontSize: '1.25rem', borderRadius: 3 },
                  inputMode: 'decimal',
                },
              }}
              inputProps={{ min: 0, max: 100, step: 0.01 }}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={save}
              startIcon={<Save size={18} />}
              sx={{ borderRadius: 3, py: 1.5, fontWeight: 800 }}
            >
              Guardar
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
