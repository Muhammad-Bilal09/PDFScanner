import { useThemeContext } from '@/context/theme-context';

export function useColorScheme(): 'light' | 'dark' {
  const context = useThemeContext();
  if (context && context.colorScheme) {
    return context.colorScheme;
  }
  return 'light';
}
