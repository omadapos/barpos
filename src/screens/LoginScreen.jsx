import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import { LogIn, Wine } from 'lucide-react';

export default function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Ingresa el PIN de acceso');
      return;
    }
    // Default PIN: 1234 — configurable via settings
    const validPin = localStorage.getItem('barpos_pin') || '1234';
    if (pin === validPin) {
      setError('');
      onLogin();
    } else {
      setError('PIN incorrecto');
      setPin('');
    }
  };

  const handleKeypad = (digit) => {
    if (pin.length < 6) setPin((prev) => prev + digit);
  };

  const handleDelete = () => setPin((prev) => prev.slice(0, -1));

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(15,23,42,0.08)',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Wine size={48} strokeWidth={1.5} />
          <Typography variant="h4" sx={{ fontWeight: 900, mt: 1.5, letterSpacing: '-0.025em' }}>
            Bar POS
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 500, mt: 0.5 }}>
            Sistema de punto de venta
          </Typography>
        </Box>

        {/* PIN Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              type="password"
              label="PIN de acceso"
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              error={!!error}
              helperText={error || ' '}
              autoFocus
              slotProps={{
                input: {
                  sx: {
                    borderRadius: 3,
                    fontWeight: 800,
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    letterSpacing: '0.5rem',
                  },
                  inputMode: 'numeric',
                },
              }}
            />

            {/* Numeric Keypad */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1.5,
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={() => handleKeypad(String(d))}
                  sx={{
                    py: 1.5,
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    borderRadius: 3,
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'rgba(99,102,241,0.06)', borderColor: 'primary.light' },
                  }}
                >
                  {d}
                </Button>
              ))}
              <Button
                type="button"
                variant="outlined"
                color="error"
                onClick={handleDelete}
                sx={{ py: 1.5, fontSize: '1rem', fontWeight: 800, borderRadius: 3 }}
              >
                ←
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                onClick={() => handleKeypad('0')}
                sx={{
                  py: 1.5, fontSize: '1.25rem', fontWeight: 800, borderRadius: 3,
                  borderColor: 'divider', color: 'text.primary',
                  '&:hover': { bgcolor: 'rgba(99,102,241,0.06)', borderColor: 'primary.light' },
                }}
              >
                0
              </Button>
              <Box />
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<LogIn size={20} />}
              disabled={!pin}
              sx={{ borderRadius: 3, py: 1.5, fontWeight: 800, fontSize: '1rem' }}
            >
              Ingresar
            </Button>
          </Stack>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', pb: 2, color: 'text.secondary' }}>
          PIN por defecto: 1234
        </Typography>
      </Paper>
    </Box>
  );
}
