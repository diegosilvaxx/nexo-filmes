import { useEffect, useState, type ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from './global.styles';
import { themes, type ThemeMode } from './theme';
import { readThemePreference, THEME_STORAGE_KEY, ThemePreferenceContext } from './theme-preference';

interface UIProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export function UIProvider({ children, initialMode }: UIProviderProps) {
  const [mode, setMode] = useState(() => initialMode ?? readThemePreference());
  const theme = themes[mode];

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme.colors.background);
  }, [mode, theme]);

  useEffect(() => {
    function syncPreference(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY || event.key === null) {
        setMode(readThemePreference());
      }
    }
    window.addEventListener('storage', syncPreference);
    return () => window.removeEventListener('storage', syncPreference);
  }, []);

  function toggleTheme() {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch {
      return;
    }
  }

  return (
    <ThemePreferenceContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </ThemePreferenceContext.Provider>
  );
}
