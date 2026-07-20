import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#0a192f' : '#60a5fa',
        light: mode === 'light' ? '#172a45' : '#93c5fd',
        dark: mode === 'light' ? '#020c1b' : '#3b82f6',
      },
      secondary: {
        main: '#0ea5e9',
      },
      success: {
        main: '#10b981',
      },
      background: {
        default: mode === 'light' ? '#f8fafc' : '#0f172a',
        paper: mode === 'light' ? '#ffffff' : '#1e293b',
      },
      text: {
        primary: mode === 'light' ? '#0f172a' : '#f8fafc',
        secondary: mode === 'light' ? '#64748b' : '#94a3b8',
      },
      divider: mode === 'light' ? '#e2e8f0' : '#334155',
    },
    typography: {
      fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 800,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 800,
        letterSpacing: '-0.02em',
      },
      h6: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      body1: {
        fontFamily: 'Inter, sans-serif',
      },
      body2: {
        fontFamily: 'Inter, sans-serif',
      },
      button: {
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 600,
        textTransform: 'none',
      },
    },
  });
};

const globalTheme = getTheme('light');
export default globalTheme;
