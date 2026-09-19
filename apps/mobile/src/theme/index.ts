import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius, shadows } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export type Theme = typeof theme;

export const useTheme = () => theme;
