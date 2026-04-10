import { Platform } from 'react-native';

// Material 3 tonal palette from design system
export const M3 = {
  primary: '#003466',
  primaryContainer: '#1a4b84',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#93bcfc',
  primaryFixed: '#d5e3ff',
  primaryFixedDim: '#a6c8ff',
  onPrimaryFixed: '#001c3b',
  onPrimaryFixedVariant: '#144780',

  secondary: '#006a6a',
  secondaryContainer: '#93efee',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#006e6e',
  secondaryFixed: '#96f2f1',
  secondaryFixedDim: '#79d5d5',
  onSecondaryFixed: '#002020',
  onSecondaryFixedVariant: '#004f50',

  tertiary: '#522900',
  tertiaryContainer: '#733c00',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#f7a967',
  tertiaryFixed: '#ffdcc3',
  tertiaryFixedDim: '#ffb77d',
  onTertiaryFixed: '#2f1500',
  onTertiaryFixedVariant: '#6e3900',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  surface: '#f8f9fa',
  surfaceDim: '#d9dadb',
  surfaceBright: '#f8f9fa',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f3f4f5',
  surfaceContainer: '#edeeef',
  surfaceContainerHigh: '#e7e8e9',
  surfaceContainerHighest: '#e1e3e4',
  surfaceVariant: '#e1e3e4',

  onSurface: '#191c1d',
  onSurfaceVariant: '#424750',
  onBackground: '#191c1d',
  background: '#f8f9fa',

  outline: '#737781',
  outlineVariant: '#c3c6d1',

  inverseSurface: '#2e3132',
  inverseOnSurface: '#f0f1f2',
  inversePrimary: '#a6c8ff',

  surfaceTint: '#335f99',
};

// Category color mapping
export const CategoryColors: Record<string, { bg: string; text: string; label: string }> = {
  dsa: { bg: M3.primaryFixed, text: M3.onPrimaryFixedVariant, label: 'DSA' },
  language: { bg: M3.tertiaryFixed, text: M3.onTertiaryFixedVariant, label: 'Language' },
  photography: { bg: M3.secondaryFixed, text: M3.onSecondaryFixedVariant, label: 'Photography' },
  generic: { bg: `${M3.tertiary}1a`, text: M3.onTertiaryFixedVariant, label: 'Generic' },
  other: { bg: M3.surfaceContainerHighest, text: M3.onSurfaceVariant, label: 'Other' },
};

// Grade colors for quiz
export const GradeColors: Record<string, { bg: string; text: string }> = {
  correct: { bg: M3.secondaryContainer, text: M3.onSecondaryContainer },
  almost: { bg: '#fff3cd', text: '#856404' },
  half: { bg: M3.tertiaryFixed, text: M3.onTertiaryFixedVariant },
  incorrect: { bg: M3.errorContainer, text: M3.onErrorContainer },
};

// Status styling
export const StatusColors: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  done: { dot: M3.secondary, bg: `${M3.secondaryContainer}4d`, text: M3.onSecondaryContainer, label: 'Done' },
  processing: { dot: M3.outline, bg: M3.surfaceContainerHighest, text: M3.onSurfaceVariant, label: 'Processing' },
  pending: { dot: M3.outline, bg: M3.surfaceContainerHighest, text: M3.onSurfaceVariant, label: 'Pending' },
  done_with_errors: { dot: M3.error, bg: `${M3.errorContainer}80`, text: M3.onErrorContainer, label: 'Done with Errors' },
  failed: { dot: M3.error, bg: M3.errorContainer, text: M3.onErrorContainer, label: 'Failed' },
};

export const Colors = {
  light: {
    text: M3.onSurface,
    background: M3.background,
    tint: M3.secondary,
    icon: M3.onSurfaceVariant,
    tabIconDefault: '#94a3b8',
    tabIconSelected: M3.secondary,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
