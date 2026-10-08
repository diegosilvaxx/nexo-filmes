export const theme = {
  colors: {
    background: '#121215',
    text: '#e6e6e9',
    muted: '#a8a8b3',
    secondary: '#a4a4b0',
    subtle: '#9494a0',
    badge: '#aaaab5',
    focus: '#b8accf',
    border: '#ffffff0f',
    badgeBorder: '#ffffff14',
  },
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

export type AppTheme = typeof theme;
