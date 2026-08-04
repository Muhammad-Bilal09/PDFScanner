import { Icon } from '@/components/shared/Icon';
import { TabBar } from '@/components/tabBar';
import { Shadows } from '@/theme';
import { Image } from 'expo-image';
import { ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './SettingsStyle';
import { useSettingsScreen } from './useSettingsScreen';

export function SettingsScreen() {
  const {
    theme,
    isDarkMode,
    settings,
    handleToggleDark,
    updateSetting,
    handleSelectPdfQuality,
    handleClearCache,
  } = useSettingsScreen();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ backgroundColor: theme.background }} edges={['top']} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.mainScroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          APPEARANCE & THEME
        </Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.sm,
          ]}
        >
          <View style={styles.rowItem}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Icon sf="moon.fill" fallback="🌙" size={18} color={theme.primary} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>
                Dark Appearance
              </Text>
              <Text
                style={[styles.rowSubtitle, { color: theme.textSecondary }]}
              >
                Sleek high-contrast dark theme
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleDark}
              trackColor={{ false: theme.inactive, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          SCANNING PREFERENCES
        </Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.sm,
          ]}
        >
          <View style={styles.rowItem}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Icon sf="crop" fallback="✂️" size={18} color={theme.primary} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>
                Auto Page Border Crop
              </Text>
              <Text
                style={[styles.rowSubtitle, { color: theme.textSecondary }]}
              >
                Automatically detect paper corners
              </Text>
            </View>
            <Switch
              value={settings.autoCrop}
              onValueChange={(val) => updateSetting('autoCrop', val)}
              trackColor={{ false: theme.inactive, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.rowItem}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Icon
                sf="photo.on.rectangle"
                fallback="🖼"
                size={18}
                color={theme.primary}
              />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>
                Save to Camera Roll
              </Text>
              <Text
                style={[styles.rowSubtitle, { color: theme.textSecondary }]}
              >
                Auto-save raw captures to photos
              </Text>
            </View>
            <Switch
              value={settings.saveToGallery}
              onValueChange={(val) => updateSetting('saveToGallery', val)}
              trackColor={{ false: theme.inactive, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          EXPORT & STORAGE
        </Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.sm,
          ]}
        >
          <Pressable style={styles.rowItem} onPress={handleSelectPdfQuality}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Icon
                sf="doc.text"
                fallback="📄"
                size={18}
                color={theme.primary}
              />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>
                Default PDF Quality
              </Text>
              <Text
                style={[styles.rowSubtitle, { color: theme.textSecondary }]}
              >
                Resolution compression preset
              </Text>
            </View>
            <Text style={[styles.rowValue, { color: theme.primary }]}>
              {(settings.pdfQuality || 'high').toUpperCase()}
            </Text>
            <Icon
              sf="chevron.right"
              fallback="›"
              size={14}
              color={theme.inactive}
            />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Pressable style={styles.rowItem} onPress={handleClearCache}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Icon
                sf="trash"
                fallback="🗑"
                size={18}
                color={theme.error}
              />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowTitle, { color: theme.error }]}>
                Clear Cache
              </Text>
              <Text
                style={[styles.rowSubtitle, { color: theme.textSecondary }]}
              >
                Free up local temporary image cache
              </Text>
            </View>
            <Icon
              sf="chevron.right"
              fallback="›"
              size={14}
              color={theme.inactive}
            />
          </Pressable>
        </View> */}

        <View
          style={[
            styles.aboutCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.sm,
          ]}
        >
          <View
            style={[
              styles.appLogoBox,
              { backgroundColor: 'transparent' },
            ]}
          >
            <Image
              source={require('@/assets/images/expo-logo.png')}
              style={{ width: 56, height: 56, borderRadius: 14 }}
              contentFit="contain"
            />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>
            Scanly
          </Text>
          <Text style={[styles.appVer, { color: theme.textSecondary }]}>
            Version 1.0.0 · Production Build
          </Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <TabBar activeTab="settings" />
    </View>
  );
}

export default SettingsScreen;
