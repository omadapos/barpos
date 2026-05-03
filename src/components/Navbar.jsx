import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function Navbar({ title, right }) {
  return (
    <Box
      component="header"
      sx={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: { xs: 3, md: 5 },
        py: 2.5,
        boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.025em', color: 'text.primary' }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
        {right}
      </Stack>
    </Box>
  );
}
