import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius, Typography, Shadows } from '@/theme';
import { Icon } from '@/components/shared/Icon';
import { LoadingView } from '@/components/shared/LoadingView';

const { width: SCREEN_W } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { hasSeenOnboarding, loading, completeOnboarding } = useOnboarding();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!loading && hasSeenOnboarding === true) {
      router.replace('/home' as any);
    }
  }, [hasSeenOnboarding, loading]);

  if (loading || hasSeenOnboarding === true) {
    return <LoadingView fullscreen message="Loading your space..." />;
  }

  const handleNext = async () => {
    if (activeSlide < 2) {
      setActiveSlide((s) => s + 1);
    } else {
      await completeOnboarding();
      router.replace('/home' as any);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/home' as any);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header - Skip Button */}
        <View style={styles.header}>
          {activeSlide < 2 ? (
            <Pressable onPress={handleSkip} hitSlop={12} style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: theme.primary }]}>Skip</Text>
            </Pressable>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>

        {/* Carousel Content */}
        <View style={styles.carouselContainer}>
          {activeSlide === 0 && (
            <View style={styles.slide}>
              <Image
                source={require('@/assets/images/onboarding_quality.png')}
                style={styles.slideImage}
                contentFit="contain"
              />
              <Text style={[styles.title, { color: theme.text }]}>Superior Quality</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                Highest resolution scans for professional results. Perfect for receipts, contracts, and certificates.
              </Text>
            </View>
          )}

          {activeSlide === 1 && (
            <View style={styles.slide}>
              <Image
                source={require('@/assets/images/onboarding_ocr.png')}
                style={styles.slideImage}
                contentFit="contain"
              />
              <Text style={[styles.title, { color: theme.text }]}>Smart OCR</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                Extract and edit text from any image with our AI-powered OCR. Search within your PDF contents instantly.
              </Text>
            </View>
          )}

          {activeSlide === 2 && (
            <View style={styles.slide}>
              <Image
                source={require('@/assets/images/onboarding_sync.png')}
                style={styles.slideImage}
                contentFit="contain"
              />
              <View style={styles.badgeRow}>
                <View style={[styles.syncBadge, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                  <Icon sf="arrow.triangle.2.circlepath" fallback="🔄" size={13} color={theme.primary} />
                  <Text style={[styles.syncBadgeText, { color: theme.primary }]}>REAL-TIME SYNC</Text>
                </View>
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Organize & Sync</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                Access your files anywhere with seamless cloud synchronization. Whether on your phone or tablet, your documents are secure.
              </Text>
            </View>
          )}
        </View>

        {/* Footer Area */}
        <View style={styles.footer}>
          {/* Slide Indicators */}
          <View style={styles.indicatorContainer}>
            <View style={styles.indicatorRow}>
              {[0, 1, 2].map((idx) => {
                const isActive = idx === activeSlide;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isActive ? theme.primary : theme.inactive,
                        width: isActive ? 24 : 6,
                      },
                    ]}
                  />
                );
              })}
            </View>
            {activeSlide === 2 && (
              <Text style={[styles.indicatorText, { color: theme.textSecondary }]}>3 / 3</Text>
            )}
          </View>

          {/* Action Button */}
          <Pressable
            style={[styles.actionBtn, { backgroundColor: theme.primary }, Shadows.md]}
            onPress={handleNext}
          >
            <Text style={styles.actionBtnText}>
              {activeSlide === 2 ? 'Get Started' : 'Next'}
            </Text>
            <Icon sf="arrow.right" fallback="→" size={16} color="#FFFFFF" />
          </Pressable>

          {/* Bottom Card for slide 3 */}
          {activeSlide === 2 ? (
            <View style={[styles.bottomInfoCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
              <View style={[styles.deviceIconBox, { backgroundColor: theme.primaryLight }]}>
                <Icon sf="laptopcomputer.and.iphone" fallback="💻" size={20} color={theme.primary} />
              </View>
              <View style={styles.bottomInfoTextWrap}>
                <Text style={[styles.bottomInfoTitle, { color: theme.text }]}>Multi-device</Text>
                <Text style={[styles.bottomInfoSubtitle, { color: theme.textSecondary }]}>Syncs instantly across all OS</Text>
              </View>
            </View>
          ) : (
            <View style={styles.bottomPlaceholder} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  skipBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  skipText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold as any,
  },
  skipPlaceholder: {
    height: 1,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  slide: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  slideImage: {
    width: SCREEN_W * 0.75,
    height: SCREEN_W * 0.75,
    marginBottom: Spacing.md,
  },
  badgeRow: {
    marginBottom: -Spacing.xs,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
  },
  syncBadgeText: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.bold as any,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.heavy as any,
    textAlign: 'center',
  },
  description: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 20,
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: Radius.full,
  },
  indicatorText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as any,
    marginLeft: Spacing.xs,
  },
  actionBtn: {
    width: '100%',
    borderRadius: Radius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold as any,
  },
  bottomPlaceholder: {
    height: 72,
  },
  bottomInfoCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
  },
  deviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  bottomInfoTextWrap: {
    flex: 1,
    gap: Spacing.xxs,
  },
  bottomInfoTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold as any,
  },
  bottomInfoSubtitle: {
    fontSize: Typography.sizes.xs,
  },
});
