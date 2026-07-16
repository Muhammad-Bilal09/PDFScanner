import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
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
import { useTheme } from '@/hooks/use-theme';
import { LocalStorage, AppSettings } from '@/services/storage';
import { Spacing, Radius, Typography, Shadows } from '@/theme';
import { Header } from '@/components/shared/Header';
import { Icon } from '@/components/shared/Icon';
import { useOnboarding } from '@/hooks/use-onboarding';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { resetOnboarding } = useOnboarding();

  const [settings, setSettings] = useState<AppSettings>({
    autoSync: true,
    wifiOnly: true,
    darkMode: false,
  });
  const [cacheSize, setCacheSize] = useState('128 MB');

  useEffect(() => {
    const loadSettings = async () => {
      const data = await LocalStorage.getSettings();
      setSettings(data);
    };
    loadSettings();
  }, []);

  const updateSetting = async (key: keyof AppSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await LocalStorage.saveSettings(newSettings);
  };

  const handleResetTutorial = async () => {
    await resetOnboarding();
    Alert.alert('Onboarding Reset', 'Tutorial onboarding screens will now show upon next app launch.');
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

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing is available for PRO users.');
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert(feature, `${feature} options will be available in the next release.`);
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
        {/* Account Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
          <View style={styles.profileTopRow}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>AJ</Text>
            </View>
            <View style={styles.profileInfoWrap}>
              <Text style={[styles.profileName, { color: theme.text }]}>Alex Jenkins</Text>
              <View style={styles.tierBadgeRow}>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
                <Text style={[styles.tierExpiryText, { color: theme.textSecondary }]}>
                  Expires in 241 days
                </Text>
              </View>
            </View>
            <Pressable onPress={handleEditProfile} hitSlop={10} accessibilityLabel="Edit profile">
              <Icon sf="pencil.circle.fill" fallback="✎" size={26} color={theme.primary} />
            </Pressable>
          </View>

          <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

          {/* Storage Quota */}
          <View style={styles.storageSection}>
            <View style={styles.storageHeader}>
              <Text style={[styles.storageTitle, { color: theme.text }]}>Cloud Storage</Text>
              <Text style={[styles.storageValue, { color: theme.textSecondary }]}>
                <Text style={[styles.storageValueBold, { color: theme.primary }]}>12.4 GB</Text> / 50 GB
              </Text>
            </View>
            <View style={[styles.progressBarWrap, { backgroundColor: theme.border }]}>
              <View style={[styles.progressBarFill, { backgroundColor: theme.primary, width: '25%' }]} />
            </View>
          </View>
        </View>

        {/* Section: CLOUD SYNC */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>CLOUD SYNC</Text>
        <View style={[styles.optionsGroup, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
          <View style={styles.optionRow}>
            <View style={[styles.optionIconBox, { backgroundColor: theme.primaryLight }]}>
              <Icon sf="arrow.triangle.2.circlepath" fallback="↺" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>Auto-Sync</Text>
            <Switch
              value={settings.autoSync}
              onValueChange={(val) => updateSetting('autoSync', val)}
              trackColor={{ false: theme.inactive, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.optionRow}>
            <View style={[styles.optionIconBox, { backgroundColor: theme.primaryLight }]}>
              <Icon sf="wifi" fallback="📶" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>Sync over Wi-Fi only</Text>
            <Switch
              value={settings.wifiOnly}
              onValueChange={(val) => updateSetting('wifiOnly', val)}
              trackColor={{ false: theme.inactive, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Pressable style={styles.optionRow} onPress={() => handleComingSoon('Manage Storage')}>
            <View style={[styles.optionIconBox, { backgroundColor: theme.primaryLight }]}>
              <Icon sf="externaldrive.fill" fallback="💽" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>Manage Storage</Text>
            <Icon sf="chevron.right" fallback="›" size={16} color={theme.textSecondary} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.optionRow}>
            <View style={[styles.optionIconBox, { backgroundColor: 'transparent' }]} />
            <Text style={[styles.optionText, { color: theme.text }]}>Last Synced</Text>
            <Text style={[styles.lastSyncedText, { color: theme.textSecondary }]}>2 mins ago</Text>
          </View>
        </View>

        {/* Section: PREFERENCES */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>PREFERENCES</Text>
        <View style={[styles.optionsGroup, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
          <View style={styles.optionRow}>
            <View style={[styles.optionIconBox, { backgroundColor: theme.primaryLight }]}>
              <Icon sf="moon.fill" fallback="🌙" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>Dark Mode</Text>
            <Switch
              value={settings.darkMode}
              onValueChange={(val) => updateSetting('darkMode', val)}
              trackColor={{ false: theme.inactive, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section: SECURITY */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>SECURITY</Text>
        <View style={[styles.optionsGroup, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
          <Pressable style={styles.optionRow} onPress={() => handleComingSoon('App Lock')}>
            <View style={[styles.optionIconBox, { backgroundColor: theme.primaryLight }]}>
              <Icon sf="faceid" fallback="☺" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>App Lock (Face ID / PIN)</Text>
            <Icon sf="chevron.right" fallback="›" size={16} color={theme.textSecondary} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Pressable style={styles.optionRow} onPress={handleClearCache}>
            <View style={[styles.optionIconBox, { backgroundColor: theme.primaryLight }]}>
              <Icon sf="trash.fill" fallback="🗑" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>Clear Cache</Text>
            <Text style={[styles.cacheValueText, { color: theme.textSecondary }]}>{cacheSize}</Text>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Pressable style={styles.optionRow} onPress={handleResetTutorial}>
            <View style={[styles.optionIconBox, { backgroundColor: theme.primaryLight }]}>
              <Icon sf="arrow.counterclockwise.circle.fill" fallback="↺" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>Reset Tutorial Onboarding</Text>
            <Icon sf="chevron.right" fallback="›" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Section: SUPPORT & BILLING */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>SUPPORT & BILLING</Text>
        <View style={[styles.optionsGroup, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
          <Pressable style={styles.optionRow} onPress={() => handleComingSoon('Billing Details')}>
            <View style={[styles.optionIconBox, { backgroundColor: theme.primaryLight }]}>
              <Icon sf="creditcard.fill" fallback="💳" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>Billing Details</Text>
            <Icon sf="chevron.right" fallback="›" size={16} color={theme.textSecondary} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Pressable style={styles.optionRow} onPress={() => handleComingSoon('Help Center')}>
            <View style={[styles.optionIconBox, { backgroundColor: theme.primaryLight }]}>
              <Icon sf="questionmark.circle.fill" fallback="?" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>Help Center</Text>
            <Icon sf="chevron.right" fallback="›" size={16} color={theme.textSecondary} />
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
  profileCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.heavy as any,
  },
  profileInfoWrap: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 4,
  },
  profileName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.heavy as any,
  },
  tierBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  proBadge: {
    backgroundColor: '#F0A820',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  proBadgeText: {
    fontSize: Typography.sizes.xxs,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tierExpiryText: {
    fontSize: Typography.sizes.xs,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.md,
  },
  storageSection: {
    gap: Spacing.sm,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
  },
  storageValue: {
    fontSize: Typography.sizes.xs,
  },
  storageValueBold: {
    fontWeight: Typography.weights.bold as any,
  },
  progressBarWrap: {
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.full,
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
  lastSyncedText: {
    fontSize: Typography.sizes.xs,
  },
  cacheValueText: {
    fontSize: Typography.sizes.sm,
  },
});
