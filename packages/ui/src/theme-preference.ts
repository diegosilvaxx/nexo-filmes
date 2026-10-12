import { createContext } from 'react';
import type { ThemeMode } from './theme';

export const THEME_STORAGE_KEY = 'nexo-filmes:theme:v1';

export const ThemePreferenceContext = createContext<{
  mode: ThemeMode;
  toggleTheme: () => void;
} | null>(null);

export function readThemePreference(): ThemeMode {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}
