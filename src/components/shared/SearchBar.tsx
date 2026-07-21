import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius, Typography } from '@/theme';
import { Icon } from './Icon';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search documents...',
  onClear,
}: SearchBarProps) {
  const theme = useTheme();

  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: (theme.background as string) === '#0F0F10' ? '#242424' : '#EBEFEF',
          borderColor: theme.border,
        },
      ]}
    >
      <Icon sf="magnifyingglass" fallback="🔍" size={16} color={theme.textSecondary} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8} style={styles.clearBtn}>
          <Icon sf="xmark.circle.fill" fallback="✕" size={16} color={theme.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    marginVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    paddingHorizontal: Spacing.xs,
    height: '100%',
  },
  clearBtn: {
    padding: Spacing.xxs,
  },
});

export default SearchBar;
