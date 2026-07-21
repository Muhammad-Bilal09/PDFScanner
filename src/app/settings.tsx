import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabBar } from '@/components/tabBar';
import { useThemeContext } from '@/context/theme-context';
import { Header } from '@/components/shared/Header';
import { Icon } from '@/components/shared/Icon';
import { useOnboarding } from '@/hooks/use-onboarding';
import { Radius, Shadows, Spacing, Typography } from '@/theme';

export default function SettingsScreen() {
  const { theme, isDarkMode, setDarkMode } = useThemeContext();
  const { resetOnboarding } = useOnboarding();

  const [cacheSize, setCacheSize] = useState('128 MB');

  const handleResetTutorial = async () => {
    await resetOnboarding();
    Alert.alert(
      'Onboarding Reset',
      'Tutorial onboarding screens will now show upon next app launch.'
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the local image cache?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setCacheSize('0 MB');
            Alert.alert('Success', 'Cache cleared successfully!');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ backgroundColor: theme.background }} edges={['top']} />

      <Header title="Settings" showBack={false} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: PREFERENCES */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          PREFERENCES
        </Text>
        <View
          style={[
            styles.optionsGroup,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.sm,
          ]}
        >
          <View style={styles.optionRow}>
            <View
              style={[
                styles.optionIconBox,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Icon sf="moon.fill" fallback="🌙" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>
              Dark Mode
            </Text>
            <Switch
              value={isDarkMode}
              onValueChange={(val) => setDarkMode(val)}
              trackColor={{ false: theme.inactive, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section: DATA & STORAGE */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          DATA & STORAGE
        </Text>
        <View
          style={[
            styles.optionsGroup,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.sm,
          ]}
        >
          <Pressable style={styles.optionRow} onPress={handleClearCache}>
            <View
              style={[
                styles.optionIconBox,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Icon sf="trash.fill" fallback="🗑" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>
              Clear Cache
            </Text>
            <Text style={[styles.cacheValueText, { color: theme.textSecondary }]}>
              {cacheSize}
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Pressable style={styles.optionRow} onPress={handleResetTutorial}>
            <View
              style={[
                styles.optionIconBox,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Icon
                sf="arrow.counterclockwise.circle.fill"
                fallback="↺"
                size={18}
                color={theme.primary}
              />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>
              Reset Tutorial Onboarding
            </Text>
            <Icon
              sf="chevron.right"
              fallback="›"
              size={16}
              color={theme.textSecondary}
            />
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Tab Bar */}
      <TabBar activeTab="settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 20,
  },
  sectionHeading: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold as any,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  optionsGroup: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  optionIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
  cacheValueText: {
    fontSize: Typography.sizes.sm,
  },
});
