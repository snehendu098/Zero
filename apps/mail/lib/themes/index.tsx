import type { ApiThemeResponse } from '@/types';

export const defaultThemes = [
  {
    id: 'default-light',
    name: 'Default Light',
    variant: 'light' as const,
    description: 'System default light theme from your design system',
    colors: {
      primary: '#000000',
      secondary: '#f1f5f9',
      accent: '#f1f5f9',
      muted: '#f1f5f9',
    },
  },
  {
    id: 'default-dark',
    name: 'Default Dark',
    variant: 'dark' as const,
    description: 'System default dark theme from your design system',
    colors: {
      primary: '#ffffff',
      secondary: '#1e293b',
      accent: '#1e293b',
      muted: '#1e293b',
    },
  },
];
