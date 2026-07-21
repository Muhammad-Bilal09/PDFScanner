import { useRouter } from "expo-router";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/shared/Icon";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Shadows, Spacing } from "@/theme";

export type ActiveTab = "home" | "files" | "tools" | "settings" | "scan";

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
            fontWeight: active ? "800" : "600",
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View
        style={[
          styles.dot,
          { backgroundColor: theme.primary, opacity: active ? 1 : 0 },
        ]}
      />
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
    <View style={styles.container}>
      {/* Floating Camera Scanner Action Button in Bottom-Right */}
      <Animated.View
        style={[styles.floatingFabSlot, { transform: [{ scale: fabScale }] }]}
      >
        <Pressable
          onPress={() => router.push("/scan" as any)}
          onPressIn={() => animateFab(0.92)}
          onPressOut={() => animateFab(1)}
          style={[
            styles.floatingFab,
            { backgroundColor: theme.primary },
            Shadows.lg,
          ]}
          hitSlop={8}
        >
          <Icon sf="camera.fill" fallback="📷" size={24} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

      {/* 4-Tab Bottom Bar Pill */}
      <View
        style={[
          styles.outerShell,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <View
          style={[
            styles.pill,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.md,
          ]}
        >
          <TabItem
            label="Home"
            sf="house.fill"
            active={activeTab === "home"}
            onPress={() => router.replace("/home" as any)}
          />

          <TabItem
            label="Files"
            sf="doc.text.fill"
            active={activeTab === "files"}
            onPress={() => router.replace("/files" as any)}
          />

          <TabItem
            label="Tools"
            sf="grid"
            active={activeTab === "tools"}
            onPress={() => router.replace("/tools" as any)}
          />

          <TabItem
            label="Settings"
            sf="gearshape.fill"
            active={activeTab === "settings"}
            onPress={() => router.replace("/settings" as any)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
  },
  outerShell: {
    paddingTop: 4,
    paddingHorizontal: Spacing.md,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 2,
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
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
  // Floating Scan FAB
  floatingFabSlot: {
    position: "absolute",
    right: 30,
    // left: 30,
    bottom: 120,
    zIndex: 9999,
  },
  floatingFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
