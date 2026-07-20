import React, { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from './index';
import CssBaseline from '@mui/material/CssBaseline';

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light',
});

export const ThemeContextProvider = ({ children }) => {
  // Load initial mode from localStorage or default to light
  const [mode, setMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem('themeMode');
      return savedMode ? savedMode : 'light';
    } catch {
      return 'light';
    }
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode],
  );

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
