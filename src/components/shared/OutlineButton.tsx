import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Radius, Typography } from '@/theme';
import { Icon } from './Icon';
import { OutlineButtonProps } from '@/types/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OutlineButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
  iconFallback,
  style,
  textStyle,
}: OutlineButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 10, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          borderColor: theme.primary,
          opacity: disabled ? 0.6 : 1,
        },
        style,
        animatedStyle,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.primary} />
      ) : (
        <>
          {icon && iconFallback && (
            <Icon sf={icon} fallback={iconFallback} size={18} color={theme.primary} />
          )}
          <Text
            style={[
              styles.text,
              {
                color: theme.primary,
                fontFamily: Typography.families.sans,
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  text: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold as any,
  },
});

export default OutlineButton;
