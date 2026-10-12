import 'styled-components';
import type { AppTheme } from './theme';

declare module 'styled-components' {
  export interface DefaultTheme {
    mode: AppTheme['mode'];
    colors: AppTheme['colors'];
    fonts: AppTheme['fonts'];
    layout: AppTheme['layout'];
    breakpoints: AppTheme['breakpoints'];
  }
}
