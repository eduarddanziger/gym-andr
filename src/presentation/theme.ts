import { useColorScheme } from 'react-native';

// ── Palette ───────────────────────────────────────────────────────────────────

const palette = {
  // Accent — electric lime: high-energy, gym-appropriate, readable on both schemes
  accent: '#C6F135',

  dark: {
    background: '#0E0E0F',
    surface: '#1A1A1C',
    border: '#2C2C2E',
    textPrimary: '#F5F5F5',
    textSecondary: '#9A9A9E',
    textMuted: '#5A5A5E',
    danger: '#FF4C4C',
  },

  light: {
    background: '#F6F6F7',
    surface: '#FFFFFF',
    border: '#E2E2E5',
    textPrimary: '#0E0E0F',
    textSecondary: '#5A5A5E',
    textMuted: '#9A9A9E',
    danger: '#D93232',
  },
} as const;

// ── AppTheme interface ────────────────────────────────────────────────────────
// Uses string — not literal hex types — so both dark and light palettes satisfy it.

export interface AppTheme {
  background: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  danger: string;
  accent: string;
  isDark: boolean;
}

// ── useTheme hook ─────────────────────────────────────────────────────────────

export const useTheme = (): AppTheme => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? palette.dark : palette.light;
  return {
    ...colors,
    accent: palette.accent,
    isDark,
  };
};
