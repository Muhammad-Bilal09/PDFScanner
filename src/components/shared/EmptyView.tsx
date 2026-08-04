import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, Radius } from '@/theme';
import { Icon } from './Icon';
import { PrimaryButton } from './PrimaryButton';
import { EmptyViewProps } from '@/types/types';

export function EmptyView({
  icon = 'folder',
  fallback = '📁',
  title,
  description,
  actionLabel,
  onActionPress,
  onAction,
  style,
}: EmptyViewProps & { fallback?: string; onActionPress?: () => void; style?: ViewStyle }) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconBox, { backgroundColor: theme.primaryLight }]}>
        <Icon sf={icon} fallback={fallback} size={36} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {description}
      </Text>
      {actionLabel && onActionPress && (
        <PrimaryButton
          label={actionLabel}
          onPress={onActionPress}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    textAlign: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  button: {
    minWidth: 160,
  },
});

export default EmptyView;
