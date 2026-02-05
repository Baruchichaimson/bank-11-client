import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const ThemeModeContext = createContext(null);
const STORAGE_KEY = 'bankoneone-theme';

const getInitialMode = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  if (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
    return 'dark';
  }
  return 'light';
};

const applyDomTheme = (mode) => {
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
};

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    applyDomTheme(mode);
  }, [mode]);

  const toggleMode = () =>
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === 'dark' ? '#38bdf8' : '#0c4a6e' },
          secondary: { main: mode === 'dark' ? '#a78bfa' : '#3009c9' },
          background: {
            default: mode === 'dark' ? '#0b1220' : '#f1f7f7',
            paper: mode === 'dark' ? '#0f172a' : '#ffffff'
          }
        },
        typography: {
          fontFamily: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif'
        },
        shape: { borderRadius: 12 }
      }),
    [mode]
  );

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
}
