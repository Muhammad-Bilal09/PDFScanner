import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/theme';
import { LoadingViewProps } from '@/types/types';

export function LoadingView({
  message = 'Loading...',
  fullscreen = false,
  style,
}: LoadingViewProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        fullscreen && StyleSheet.absoluteFill,
        fullscreen && { backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 9999 },
        !fullscreen && { padding: Spacing.xl },
        style,
      ]}
    >
      <View
        style={[
          styles.spinnerBox,
          fullscreen && {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: Spacing.lg,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 5,
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        {message && (
          <Text style={[styles.text, { color: theme.text, marginTop: Spacing.sm }]}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    textAlign: 'center',
  },
});

export default LoadingView;
