import { Header } from '@/components/shared/Header';
import { Icon } from '@/components/shared/Icon';
import { OutlineButton } from '@/components/shared/OutlineButton';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Shadows } from '@/theme';
import { CompressionQuality, PaperSize } from '@/types/types';
import { showAlert } from '@/utils/alert';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './ExportShareStyle';
import { useExportShareScreen } from './useExportShareScreen';

export function ExportShareScreen() {
  const {
    theme,
    document,
    paperSize,
    setPaperSize,
    quality,
    setQuality,
    removeWatermark,
    setRemoveWatermark,
    passwordProtection,
    setPasswordProtection,
    setGeneratedPdfUri,
    exporting,
    exportProgressMsg,
    handleShare,
    handlePrint,
  } = useExportShareScreen();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ backgroundColor: theme.background }} edges={['top']} />

      <Header title="Export & Share" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {document && (
          <View
            style={[
              styles.fileSummaryCard,
              {
                backgroundColor: theme.primaryLight,
                borderColor: theme.primary,
              },
            ]}
          >
            <Icon sf="info.circle" fallback="ℹ" size={20} color={theme.primary} />
            <View style={styles.summaryTextWrap}>
              <Text style={[styles.summaryTitle, { color: theme.primary }]}>
                EXPORT SUMMARY
              </Text>
              <Text
                style={[styles.fileName, { color: theme.text }]}
                numberOfLines={1}
              >
                {document.name || document.title || 'Document'}
              </Text>
              <Text
                style={[styles.fileDetails, { color: theme.textSecondary }]}
              >
                {(document.pagesList || []).length} Pages · Quality:{' '}
                {quality.toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.sectionHeading, { color: theme.text }]}>
          Page Dimensions
        </Text>
        <View style={styles.formatRow}>
          {(['A4', 'Letter', 'Legal'] as PaperSize[]).map((size) => {
            const isSelected = size === paperSize;
            return (
              <Pressable
                key={size}
                style={[
                  styles.formatBtn,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                  isSelected && {
                    borderColor: theme.primary,
                    backgroundColor: theme.primaryLight,
                  },
                ]}
                onPress={() => {
                  setPaperSize(size);
                  setGeneratedPdfUri(null);
                }}
              >
                <Text
                  style={[
                    styles.formatLabel,
                    {
                      color: isSelected ? theme.primary : theme.textSecondary,
                    },
                  ]}
                >
                  {size}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionHeading, { color: theme.text }]}>
          Compression Resolution
        </Text>
        <View style={styles.formatRow}>
          {(['original', 'high', 'medium', 'low'] as CompressionQuality[]).map(
            (q) => {
              const isSelected = q === quality;
              return (
                <Pressable
                  key={q}
                  style={[
                    styles.formatBtn,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    isSelected && {
                      borderColor: theme.primary,
                      backgroundColor: theme.primaryLight,
                    },
                  ]}
                  onPress={() => {
                    setQuality(q);
                    setGeneratedPdfUri(null);
                  }}
                >
                  <Text
                    style={[
                      styles.formatLabel,
                      {
                        color: isSelected
                          ? theme.primary
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    {q.toUpperCase()}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

        <View
          style={[
            styles.optionsCard,
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
              <Icon
                sf="doc.on.doc"
                fallback="📄"
                size={18}
                color={theme.primary}
              />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>
                Scanly Document Watermark
              </Text>
              <Text
                style={[styles.optionSubtitle, { color: theme.textSecondary }]}
              >
                Add official logo watermark on PDF pages
              </Text>
            </View>
            <Switch
              value={!removeWatermark}
              onValueChange={(val) => {
                setRemoveWatermark(!val);
                setGeneratedPdfUri(null);
              }}
              trackColor={{ false: theme.inactive, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.optionRow}>
            <View
              style={[
                styles.optionIconBox,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Icon
                sf="lock.fill"
                fallback="🔒"
                size={18}
                color={theme.primary}
              />
            </View>
            {/* <View style={styles.optionTextWrap}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>
                Password Protection
              </Text>
              <Text
                style={[styles.optionSubtitle, { color: theme.textSecondary }]}
              >
                AES-256 PDF Encryption (PRO)
              </Text>
            </View> */}
            <Switch
              value={passwordProtection}
              onValueChange={(val) => {
                if (val) {
                  showAlert(
                    'PRO Feature',
                    'Secure PDF encryption is a premium upgrade.'
                  );
                }
              }}
              trackColor={{ false: theme.inactive, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {exporting && (
          <View
            style={[
              styles.progressCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.sm,
            ]}
          >
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.progressText, { color: theme.text }]}>
              {exportProgressMsg}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionHeading, { color: theme.text }]}>
          Quick Actions
        </Text>
        <View
          style={[
            styles.shareAppsRow,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.sm,
          ]}
        >
          <Pressable style={styles.appBtn} onPress={handleShare}>
            <View
              style={[
                styles.appIconCircle,
                { backgroundColor: theme.primary },
              ]}
            >
              <Icon
                sf="square.and.arrow.up"
                fallback="↗"
                size={18}
                color="#FFFFFF"
              />
            </View>
            <Text style={[styles.appLabel, { color: theme.textSecondary }]}>
              Send File
            </Text>
          </Pressable>

          <Pressable style={styles.appBtn} onPress={handlePrint}>
            <View
              style={[styles.appIconCircle, { backgroundColor: '#2196F3' }]}
            >
              <Icon
                sf="printer.fill"
                fallback="🖨"
                size={18}
                color="#FFFFFF"
              />
            </View>
            <Text style={[styles.appLabel, { color: theme.textSecondary }]}>
              Print
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View
        style={[
          styles.bottomCtaBar,
          { backgroundColor: theme.surface, borderTopColor: theme.border },
        ]}
      >
        <OutlineButton
          label="Print Docs"
          onPress={handlePrint}
          style={styles.saveFilesBtn}
        />
        <PrimaryButton
          label="Compile & Share"
          onPress={handleShare}
          icon="square.and.arrow.up"
          iconFallback="↗"
          style={styles.exportBtn}
          loading={exporting}
        />
      </View>
    </View>
  );
}

export default ExportShareScreen;
