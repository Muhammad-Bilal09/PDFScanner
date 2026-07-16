import { useRouter } from 'expo-router';
import { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { Icon } from '@/components/shared/Icon';
import { Spacing, Radius, Shadows } from '@/theme';

export type ActiveTab = 'library' | 'ocr' | 'scan' | 'cloud' | 'settings';

interface TabBarProps {
  activeTab: ActiveTab;
}

function TabItem({
  label,
  sf,
  active,
  onPress,
}: {
  label: string;
  sf: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (v: number) =>
    Animated.spring(scale, {
      toValue: v,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(0.9)}
      onPressOut={() => animateTo(1)}
      style={styles.tabItem}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.iconPill,
          active && { backgroundColor: theme.primaryLight },
          { transform: [{ scale }] },
        ]}
      >
        <Icon
          sf={sf}
          fallback=""
          size={20}
          color={active ? theme.primary : theme.textSecondary}
        />
      </Animated.View>
      <Text
        style={[
          styles.label,
          {
            color: active ? theme.primary : theme.textSecondary,
            fontWeight: active ? '800' : '600',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View style={[styles.dot, { backgroundColor: theme.primary, opacity: active ? 1 : 0 }]} />
    </Pressable>
  );
}

export function TabBar({ activeTab }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fabScale = useRef(new Animated.Value(1)).current;

  const animateFab = (v: number) =>
    Animated.spring(fabScale, {
      toValue: v,
      useNativeDriver: true,
      speed: 24,
      bounciness: 8,
    }).start();

  return (
    <View style={[styles.outerShell, { backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.pill, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
        
        {/* Left Side Tabs */}
        <TabItem
          label="Library"
          sf="folder.fill"
          active={activeTab === 'library'}
          onPress={() => router.replace('/home' as any)}
        />

        <TabItem
          label="OCR"
          sf="text.viewfinder"
          active={activeTab === 'ocr'}
          onPress={() => router.replace('/ocrRecognition' as any)}
        />

        {/* Center elevated FAB */}
        <View style={styles.fabSlot}>
          <Animated.View style={{ transform: [{ scale: fabScale }] }}>
            <Pressable
              onPress={() => router.replace('/scan' as any)}
              onPressIn={() => animateFab(0.92)}
              onPressOut={() => animateFab(1)}
              hitSlop={8}
            >
              <View style={[styles.fabRing, { backgroundColor: theme.background }]}>
                <View style={[styles.fab, { backgroundColor: theme.primary }, Shadows.lg]}>
                  <View style={styles.fabHighlight} pointerEvents="none" />
                  <Icon sf="camera.fill" fallback="" size={24} color="#FFFFFF" />
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </View>

        {/* Right Side Tabs */}
        <TabItem
          label="Cloud"
          sf="cloud.fill"
          active={activeTab === 'cloud'}
          onPress={() => router.replace('/settings' as any)}
        />

        <TabItem
          label="Settings"
          sf="slider.horizontal.3"
          active={activeTab === 'settings'}
          onPress={() => router.replace('/settings' as any)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerShell: {
    paddingTop: 4,
    paddingHorizontal: Spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 9.5,
    letterSpacing: 0.1,
  },
  dot: {
    width: 12,
    height: 3,
    borderRadius: Radius.full,
    marginTop: 1,
  },
  // Elevated Circular FAB in Center
  fabSlot: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    marginTop: -32,
  },
  fabRing: {
    width: 66,
    height: 66,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fabHighlight: {
    position: 'absolute',
    top: -15,
    left: -15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});