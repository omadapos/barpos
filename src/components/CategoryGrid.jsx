import React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function CategoryGrid({ categories, activeCategory, onSelect }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }} useFlexGap>
      {(categories || []).map((c) => {
        const active = activeCategory?.id === c.id;
        return (
          <ButtonBase
            key={c.id}
            onClick={() => onSelect(c)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              minHeight: 80,
              minWidth: 120,
              px: 2.5,
              py: 2,
              borderRadius: 3,
              border: '2px solid',
              borderColor: active ? 'primary.main' : 'transparent',
              bgcolor: c.color || '#6366f1',
              boxShadow: active
                ? '0 0 0 3px rgba(99, 102, 241, 0.25)'
                : '0 2px 6px rgba(15,23,42,0.08)',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
              },
            }}
          >
            <Typography sx={{ fontSize: '1.8rem', lineHeight: 1 }}>{c.icon}</Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.8rem',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {c.name}
            </Typography>
          </ButtonBase>
        );
      })}
    </Stack>
  );
}
