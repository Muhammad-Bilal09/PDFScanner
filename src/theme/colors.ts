export const Colors = {
  light: {
    primary: '#DC2626',
    primaryLight: '#FEF2F2',
    primaryDark: '#991B1B',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#171717',
    textSecondary: '#737373',
    border: '#E5E5E5',
    error: '#DC2626',
    errorLight: '#FEF2F2',
    success: '#2563EB',
    successLight: '#EFF6FF',
    warning: '#F97316',
    warningLight: '#FFF7ED',
    orange: '#FF6535',
    inactive: '#D4D4D4',
    iconDefault: '#171717',
    shadow: '#000000',
  },
  dark: {
    primary: '#EF4444',
    primaryLight: '#450A0A',
    primaryDark: '#FCA5A5',
    background: '#0F0F10',
    surface: '#1C1C1E',
    text: '#F4F4F5',
    textSecondary: '#A1A1AA',
    border: '#2D2D30',
    error: '#EF4444',
    errorLight: '#450A0A',
    success: '#3B82F6',
    successLight: '#1E3A8A',
    warning: '#FBA74D',
    warningLight: '#3E2723',
    orange: '#FF8A65',
    inactive: '#52525B',
    iconDefault: '#F4F4F5',
    shadow: '#000000',
  },
} as const;

export type ThemePalette = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  errorLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  orange: string;
  inactive: string;
  iconDefault: string;
  shadow: string;
};

export type ThemeType = ThemePalette;
