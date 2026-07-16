import { Platform } from 'react-native';

export const Typography = {
  families: Platform.select({
    ios: {
      sans: 'System',
      serif: 'Georgia',
      mono: 'Courier',
    },
    android: {
      sans: 'sans-serif',
      serif: 'serif',
      mono: 'monospace',
    },
    default: {
      sans: 'System',
      serif: 'Georgia',
      mono: 'Courier',
    },
  }),
  sizes: {
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    thin: '100',
    ultraLight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '900',
  } as const,
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
} as const;

export type TypographyType = typeof Typography;
