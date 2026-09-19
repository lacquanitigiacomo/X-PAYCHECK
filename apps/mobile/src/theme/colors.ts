export const colors = {
  // Backgrounds
  background: '#0F1419',
  surface: '#1A1F24',
  surfaceElevated: '#242B32',
  surfaceHighlight: '#2D3640',

  // Primary / Accent
  primary: '#2DD4A0',
  primaryDark: '#1FA87D',
  primaryLight: '#5EE0B8',
  primaryMuted: 'rgba(45, 212, 160, 0.15)',

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Text
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0F1419',

  // Borders
  border: 'rgba(148, 163, 184, 0.12)',
  borderFocus: 'rgba(45, 212, 160, 0.5)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Specific UI
  badgeFreemium: '#64748B',
  badgePro: '#2DD4A0',
  badgeTrial: '#3B82F6',

  // Chart / Dataviz
  chartPositive: '#22C55E',
  chartNegative: '#EF4444',
  chartNeutral: '#94A3B8',
} as const;

export type Colors = typeof colors;
