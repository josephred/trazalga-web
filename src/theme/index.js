import { createTheme } from '@mui/material/styles';

const globalTheme = createTheme({
  palette: {
    primary: {
      main: '#0a192f',
      light: '#172a45',
      dark: '#020c1b',
    },
    secondary: {
      main: '#0ea5e9',
    },
    success: {
      main: '#10b981',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
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

export default globalTheme;
