import { createTheme } from '@mui/material/styles';

/**
 * OmadaPOS "Soft Minimalist" / "Silk White & Slate" Design System
 * ─────────────────────────────────────────────────────────────────
 * Light theme with Glassmorphism accents, high-weight typography,
 * rounded corners (borderRadius 3–4), and premium color palette.
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1',      // Indigo-500
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#fff',
    },
    secondary: {
      main: '#8b5cf6',      // Violet-500
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#fff',
    },
    success: {
      main: '#10b981',      // Emerald-500
      light: '#34d399',
      dark: '#059669',
      contrastText: '#fff',
    },
    error: {
      main: '#ef4444',      // Red-500
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#fff',
    },
    warning: {
      main: '#f59e0b',      // Amber-500
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#fff',
    },
    background: {
      default: '#f8fafc',   // Slate-50
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',   // Slate-800
      secondary: '#64748b', // Slate-500
    },
    divider: '#e2e8f0',     // Slate-200
  },

  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 900, letterSpacing: '-0.025em' },
    h2: { fontWeight: 900, letterSpacing: '-0.025em' },
    h3: { fontWeight: 800, letterSpacing: '-0.02em' },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 800 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 800, textTransform: 'none' },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400, color: '#64748b' },
  },

  shape: {
    borderRadius: 12,       // base unit (borderRadius: 1 = 12px)
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          },
        },
        containedSuccess: {
          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          },
        },
        containedError: {
          background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            fontWeight: 600,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;
