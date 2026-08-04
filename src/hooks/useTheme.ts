import { useThemeContext } from '@/context/themeContext';
import { Colors } from '@/theme/colors';

export function useTheme() {
  const context = useThemeContext();
  if (context && context.theme) {
    return context.theme;
  }
  return Colors.light;
}
