import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/theme';
import { HeaderAction, HeaderProps } from '@/types/types';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';

export function Header({
  title,
  showBack = true,
  onBackPress,
  onBack,
  actions = [],
}: HeaderProps & { onBackPress?: () => void; rightActions?: HeaderAction[] }) {
  const theme = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home' as any);
    }
  };

  const actionList = actions.length > 0 ? actions : [];

  return (
    <View style={[styles.container, { borderBottomColor: theme.border }]}>
      <View style={styles.leftContainer}>
        {showBack && (
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={styles.backBtn}
            accessibilityLabel="Go back"
          >
            <Icon sf="chevron.left" fallback="‹" size={24} color={theme.primary} />
          </Pressable>
        )}
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.rightContainer}>
        {actionList.map((action, index) => (
          <Pressable
            key={index}
            onPress={action.onPress}
            hitSlop={10}
            style={styles.actionBtn}
          >
            <Icon
              sf={action.icon}
              fallback={action.icon}
              size={20}
              color={action.color || theme.primary}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionBtn: {
    padding: Spacing.xs,
  },
});

export default Header;
