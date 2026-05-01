// src/presentation/theme.ts
import { useColorScheme } from 'react-native';

// Palette
const palette = {
  // Accent — electric lime: high-energy, gym-appropriate, works on both dark and light
  accent: '#C6F135',
  accentDark: '#9BBF1A',

  // Dark scheme
  dark: {
    background: '#0E0E0F',
    surface: '#1A1A1C',
    border: '#2C2C2E',
    textPrimary: '#F5F5F5',
    textSecondary: '#9A9A9E',
    textMuted: '#5A5A5E',
    danger: '#FF4C4C',
  },

  // Light scheme
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

export interface AppTheme {
  background: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  danger: string;
  isDark: boolean;
  accent: string;
}

export const useTheme = (): AppTheme => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    ...(isDark ? palette.dark : palette.light),
    isDark,
    accent: palette.accent,
  };
};
