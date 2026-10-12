export type ThemeMode = 'dark' | 'light';

const darkColors = {
  background: '#121215',
  text: '#e6e6e9',
  muted: '#a8a8b3',
  secondary: '#a4a4b0',
  subtle: '#9494a0',
  badge: '#aaaab5',
  focus: '#b8accf',
  border: '#ffffff0f',
  badgeBorder: '#ffffff14',
  surface: '#1b1b20',
  poster: '#202026',
  controlBorder: '#ffffff24',
  hoverBackground: '#ffffff08',
  hoverBorder: '#ffffff50',
  selected: '#c9badd',
  selectedBorder: '#b8accf55',
  selectedBackground: '#b8accf09',
  noticeBorder: '#ffffff20',
  rating: '#dccb9c',
  error: '#e3aaaa',
  errorBorder: '#d6a2a2',
  switchTrack: '#202026',
  switchThumb: '#a8a8b3',
} as const;

const commonTheme = {
  fonts: {
    body: 'system-ui, sans-serif',
  },
  layout: {
    contentWidth: '1080px',
    gutter: '24px',
  },
  breakpoints: {
    mobile: '540px',
  },
} as const;

export type AppTheme = typeof commonTheme & {
  mode: ThemeMode;
  colors: Record<keyof typeof darkColors, string>;
};

export const themes: Record<ThemeMode, AppTheme> = {
  dark: { ...commonTheme, mode: 'dark', colors: darkColors },
  light: {
    ...commonTheme,
    mode: 'light',
    colors: {
      background: '#f7f7fa',
      text: '#202027',
      muted: '#5e5e6c',
      secondary: '#585868',
      subtle: '#646474',
      badge: '#5e5e6c',
      focus: '#665180',
      border: '#dedee6',
      badgeBorder: '#d8d8e2',
      surface: '#ffffff',
      poster: '#e9e9f0',
      controlBorder: '#b9b9c8',
      hoverBackground: '#ededf4',
      hoverBorder: '#9999af',
      selected: '#665180',
      selectedBorder: '#a08db7',
      selectedBackground: '#ece7f2',
      noticeBorder: '#d8d8e2',
      rating: '#76581e',
      error: '#a33b42',
      errorBorder: '#b34b53',
      switchTrack: '#dedee6',
      switchThumb: '#ffffff',
    },
  },
};
