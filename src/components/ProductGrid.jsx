import React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { formatMoney } from '@/lib/format';

export default function ProductGrid({ products, onProduct, isBottleCategory }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 2,
      }}
    >
      {(products || []).map((p) => (
        <ButtonBase
          key={p.id}
          onClick={() => onProduct(p)}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            minHeight: 90,
            px: 2,
            py: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'primary.light',
              bgcolor: 'rgba(99, 102, 241, 0.04)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)',
            },
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'text.primary',
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            {p.name}
          </Typography>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: '1.05rem',
              color: 'success.main',
            }}
          >
            {isBottleCategory ? 'Medidas' : formatMoney(p.price)}
          </Typography>
        </ButtonBase>
      ))}
    </Box>
  );
}
