import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import ButtonBase from '@mui/material/ButtonBase';
import { X } from 'lucide-react';
import { formatMoney } from '@/lib/format';

const measureEmoji = {
  Trago: '🥃',
  Cuarto: '🥃',
  Media: '🍾',
  Litro: '🍾',
};

export default function MeasureModal({ product, open, onClose, onSelectMeasure }) {
  const [measures, setMeasures] = useState([]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!open || !product?.id) {
        setMeasures([]);
        return;
      }
      const list = await window.electronAPI.getMeasures(product.id);
      if (!cancelled) setMeasures(list || []);
    })();
    return () => { cancelled = true; };
  }, [open, product]);

  if (!open || !product) return null;

  return (
    <Box
      onClick={onClose}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
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
          maxWidth: 600,
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
            bgcolor: 'secondary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {product.name}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <X size={24} />
          </IconButton>
        </Box>

        {/* Measures Grid */}
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
            }}
          >
            {measures.map((m) => (
              <ButtonBase
                key={m.id}
                onClick={() => onSelectMeasure(m)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  minHeight: 120,
                  py: 3,
                  borderRadius: 4,
                  border: '2px solid',
                  borderColor: 'secondary.light',
                  bgcolor: 'rgba(139, 92, 246, 0.06)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'secondary.main',
                    bgcolor: 'rgba(139, 92, 246, 0.12)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.15)',
                  },
                }}
              >
                <Typography sx={{ fontSize: '2.5rem' }}>
                  {measureEmoji[m.measure_name] || '🥃'}
                </Typography>
                <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.1rem' }}>
                  {m.measure_name}
                </Typography>
                <Typography sx={{ fontWeight: 900, color: 'success.main', fontSize: '1.25rem' }}>
                  {formatMoney(m.price)}
                </Typography>
              </ButtonBase>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
