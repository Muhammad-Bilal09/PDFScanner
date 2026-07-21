import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Clipboard,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

import { useTheme } from '@/hooks/use-theme';
import { useDocuments } from '@/hooks/use-documents';
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';
import { Spacing, Radius, Typography, Shadows } from '@/theme';
import { Header } from '@/components/shared/Header';
import { Icon } from '@/components/shared/Icon';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { OutlineButton } from '@/components/shared/OutlineButton';
import { DocumentItemType } from '@/components/shared/DocumentCard';
import { PdfService, PaperSize, CompressionQuality } from '@/services/pdf';

export default function ExportShareScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { documents, updateDocument } = useDocuments();
  const { upload, progress, status, error, result, reset } = useCloudinaryUpload();

  const [document, setDocument] = useState<DocumentItemType | null>(null);
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [quality, setQuality] = useState<CompressionQuality>('high');
  const [removeWatermark, setRemoveWatermark] = useState(true);
  const [passwordProtection, setPasswordProtection] = useState(false);

  // Cache path for compiled PDF
  const [generatedPdfUri, setGeneratedPdfUri] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgressMsg, setExportProgressMsg] = useState('');

  useEffect(() => {
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      setDocument({
        ...doc,
        pagesList: doc.pagesList || [],
      });
    }
  }, [id, documents]);

  // Reset Cloudinary state on unmount or doc change
  useEffect(() => {
    reset();
  }, [id]);

  // PDF generation trigger
  const handleGeneratePdf = async (): Promise<string | null> => {
    if (!document) return null;
    const pagesList = document.pagesList || [];
    if (pagesList.length === 0) {
      Alert.alert('Empty Document', 'Cannot generate PDF for a document with no pages.');
      return null;
    }

    setExporting(true);
    setExportProgressMsg('Processing document pages...');

    try {
      const pdfUri = await PdfService.generatePdf(document.name, pagesList, {
        paperSize,
        quality,
        removeWatermark,
      });

      // Update formatted file size locally
      const formattedSize = await PdfService.getFormattedFileSize(pdfUri);
      await updateDocument(document.id, { size: formattedSize });

      setGeneratedPdfUri(pdfUri);
      return pdfUri;
    } catch (e: any) {
      Alert.alert('PDF Export Failed', e.message || 'Error occurred during generation.');
      return null;
    } finally {
      setExporting(false);
    }
  };

  // Main Share trigger
  const handleShare = async () => {
    if (!document) return;

    let localUri = generatedPdfUri;
    if (!localUri) {
      localUri = await handleGeneratePdf();
    }

    if (!localUri) return;

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${document.name}`,
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Native sharing is not supported on this platform.');
      }
    } catch (e) {
      Alert.alert('Share Error', 'Failed to share document.');
    }
  };

  // Upload compiled PDF to Cloudinary
  const handleUploadCloudinary = async () => {
    if (!document) return;

    let uploadUri = generatedPdfUri;
    if (!uploadUri) {
      uploadUri = await handleGeneratePdf();
    }

    if (!uploadUri) return;

    try {
      const response = await upload(uploadUri);
      
      // Update local storage record with the Cloudinary URL & metadata
      await updateDocument(document.id, {
        cloudinaryUrl: response.secure_url,
      });

      Alert.alert(
        'Upload Successful',
        `PDF successfully uploaded to Cloudinary!`,
        [
          { text: 'Copy Link', onPress: () => Clipboard.setString(response.secure_url) },
          { text: 'OK' },
        ]
      );
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message || 'Cloudinary upload encountered an error.');
    }
  };

  // Native Print Dialog
  const handlePrint = async () => {
    let localUri = generatedPdfUri;
    if (!localUri) {
      localUri = await handleGeneratePdf();
    }

    if (!localUri) return;

    try {
      await Print.printAsync({ uri: localUri });
    } catch (e) {
      Alert.alert('Print Error', 'Failed to initialize system printer.');
    }
  };

  const handleCopyLink = () => {
    const link = result?.secure_url || document?.cloudinaryUrl;
    if (link) {
      Clipboard.setString(link);
      Alert.alert('Copied', 'Cloudinary download link copied to clipboard!');
    } else {
      Alert.alert('Not Uploaded', 'Please upload to cloud first by clicking "Cloud Upload".');
    }
  };

  const handleOpenLink = () => {
    const link = result?.secure_url || document?.cloudinaryUrl;
    if (link) {
      Linking.openURL(link).catch(() => {
        Alert.alert('Error', 'Failed to open link.');
      });
    }
  };

  const uploadedUrl = result?.secure_url || document?.cloudinaryUrl;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ backgroundColor: theme.background }} edges={['top']} />

      <Header title="Export & Share" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Document summary header */}
        {document && (
          <View style={[styles.fileSummaryCard, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
            <Icon sf="info.circle" fallback="ℹ" size={20} color={theme.primary} />
            <View style={styles.summaryTextWrap}>
              <Text style={[styles.summaryTitle, { color: theme.primary }]}>EXPORT SUMMARY</Text>
              <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                {document.name}
              </Text>
              <Text style={[styles.fileDetails, { color: theme.textSecondary }]}>
                {(document.pagesList || []).length} Pages · Quality: {quality.toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        {/* Paper Size selector */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Page Dimensions</Text>
        <View style={styles.formatRow}>
          {(['A4', 'Letter', 'Legal'] as PaperSize[]).map((size) => {
            const isSelected = size === paperSize;
            return (
              <Pressable
                key={size}
                style={[
                  styles.formatBtn,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isSelected && { borderColor: theme.primary, backgroundColor: theme.primaryLight },
                ]}
                onPress={() => {
                  setPaperSize(size);
                  setGeneratedPdfUri(null); // invalidate cached PDF
                }}
              >
                <Text style={[styles.formatLabel, { color: isSelected ? theme.primary : theme.textSecondary }]}>
                  {size}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Quality selector */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Compression Resolution</Text>
        <View style={styles.formatRow}>
          {(['original', 'high', 'medium', 'low'] as CompressionQuality[]).map((q) => {
            const isSelected = q === quality;
            return (
              <Pressable
                key={q}
                style={[
                  styles.formatBtn,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isSelected && { borderColor: theme.primary, backgroundColor: theme.primaryLight },
                ]}
                onPress={() => {
                  setQuality(q);
                  setGeneratedPdfUri(null); // invalidate cache
                }}
              >
                <Text style={[styles.formatLabel, { color: isSelected ? theme.primary : theme.textSecondary }]}>
                  {q.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Watermark & password option card */}
        <View style={[styles.optionsCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
          <View style={styles.optionRow}>
            <View style={[styles.optionIconBox, { backgroundColor: theme.primaryLight }]}>
              <Icon sf="doc.on.doc" fallback="📄" size={18} color={theme.primary} />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Clean PDF Watermark</Text>
              <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>Remove watermark signature</Text>
            </View>
            <Switch
              value={removeWatermark}
              onValueChange={(val) => {
                setRemoveWatermark(val);
                setGeneratedPdfUri(null); // Invalidate cached PDF
              }}
              trackColor={{ false: theme.inactive, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.optionRow}>
            <View style={[styles.optionIconBox, { backgroundColor: theme.primaryLight }]}>
              <Icon sf="lock.fill" fallback="🔒" size={18} color={theme.primary} />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Password Protection</Text>
              <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>AES-256 PDF Encryption (PRO)</Text>
            </View>
            <Switch
              value={passwordProtection}
              onValueChange={(val) => {
                if (val) {
                  Alert.alert('PRO Feature', 'Secure PDF encryption is a premium upgrade.');
                }
              }}
              trackColor={{ false: theme.inactive, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Local PDF Generation Status Card */}
        {exporting && (
          <View style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.progressText, { color: theme.text }]}>
              {exportProgressMsg}
            </Text>
          </View>
        )}

        {/* Cloudinary Integration Status Panels */}
        {status === 'uploading' && (
          <View style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
            <View style={styles.progressBarWrapper}>
              <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: Spacing.xs }} />
              <Text style={[styles.progressText, { color: theme.text }]}>
                Uploading to Cloudinary: {progress}%
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
            </View>
          </View>
        )}

        {status === 'error' && (
          <View style={[styles.errorCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.errorIconRow}>
              <Icon sf="xmark.circle.fill" fallback="⚠️" size={18} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]} numberOfLines={2}>
                Upload failed: {error}
              </Text>
            </View>
            <Pressable style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={handleUploadCloudinary}>
              <Text style={styles.retryBtnText}>Retry Upload</Text>
            </Pressable>
          </View>
        )}



        {/* Share apps grid */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Quick Actions</Text>
        <View style={[styles.shareAppsRow, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
          <Pressable style={styles.appBtn} onPress={handleShare}>
            <View style={[styles.appIconCircle, { backgroundColor: theme.primary }]}>
              <Icon sf="square.and.arrow.up" fallback="↗" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.appLabel, { color: theme.textSecondary }]}>Send File</Text>
          </Pressable>

          <Pressable style={styles.appBtn} onPress={handlePrint}>
            <View style={[styles.appIconCircle, { backgroundColor: '#2196F3' }]}>
              <Icon sf="printer.fill" fallback="🖨" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.appLabel, { color: theme.textSecondary }]}>Print</Text>
          </Pressable>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Export Bar */}
      <View style={[styles.bottomCtaBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <OutlineButton
          label="Print Document"
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
  },
  fileSummaryCard: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  summaryTextWrap: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 2,
  },
  summaryTitle: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  fileName: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
  },
  fileDetails: {
    fontSize: Typography.sizes.xs,
  },
  sectionHeading: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingLeft: 2,
  },
  formatRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  formatBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
  },
  optionsCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  optionIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  optionTextWrap: {
    flex: 1,
    gap: 1,
  },
  optionTitle: {
    fontSize: Typography.sizes.xs + 0.5,
    fontWeight: '800',
  },
  optionSubtitle: {
    fontSize: Typography.sizes.xxs,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  progressCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.md,
    flexDirection: 'column',
    gap: Spacing.xs,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333333',
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  errorCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
    flexDirection: 'column',
  },
  errorIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    flex: 1,
  },
  retryBtn: {
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    alignSelf: 'flex-end',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xs,
    fontWeight: '800',
  },
  successCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  successTitle: {
    fontSize: Typography.sizes.xs + 0.5,
    fontWeight: '800',
  },
  successUrlText: {
    fontSize: Typography.sizes.xxs,
    marginTop: 2,
  },
  successActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    gap: 4,
  },
  actionBadgeBtnText: {
    fontSize: 9,
    fontWeight: '800',
  },
  shareAppsRow: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  appBtn: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  appIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLabel: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  bottomCtaBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  saveFilesBtn: {
    flex: 1,
  },
  exportBtn: {
    flex: 1.5,
  },
});
