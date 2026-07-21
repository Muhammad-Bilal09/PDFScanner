import { Colors } from '@/theme/colors';
import { useThemeContext } from '@/context/theme-context';

export function useTheme() {
  const context = useThemeContext();
  if (context && context.theme) {
    return context.theme;
  }
  return Colors.light;
}
