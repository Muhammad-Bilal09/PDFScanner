import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Clipboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import { Paths } from 'expo-file-system';
import { writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';

const cacheDirectory = Paths.cache.uri.endsWith('/') ? Paths.cache.uri : Paths.cache.uri + '/';
import { Image } from 'expo-image';

import { useTheme } from '@/hooks/use-theme';
import { useDocuments } from '@/hooks/use-documents';
import { Spacing, Radius, Typography, Shadows } from '@/theme';
import { Header } from '@/components/shared/Header';
import { Icon } from '@/components/shared/Icon';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { OutlineButton } from '@/components/shared/OutlineButton';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { TabBar } from '@/components/tabBar';
import { DocumentItemType, PageItemType } from '@/components/shared/DocumentCard';
import { ImageProcessor } from '@/services/processor';

const LANGUAGES = [
  { label: 'English', key: 'eng' },
  { label: 'Urdu', key: 'urd' },
  { label: 'Arabic', key: 'ara' },
];

export default function OcrRecognitionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { documents, updateDocument } = useDocuments();

  const [document, setDocument] = useState<DocumentItemType | null>(null);
  const [showDocPicker, setShowDocPicker] = useState<boolean>(false);
  
  // Page selector
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'result' | 'compare'>('result');
  const [fontSize, setFontSize] = useState<number>(14);
  const [language, setLanguage] = useState(LANGUAGES[0]); // English default
  const [showLanguageMenu, setShowLanguageMenu] = useState<boolean>(false);
  
  // OCR states
  const [ocrText, setOcrText] = useState('');
  const [running, setRunning] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  useEffect(() => {
    if (id) {
      const doc = documents.find((d) => d.id === id);
      if (doc) {
        setDocument(doc);
        const activePage = doc.pagesList?.[selectedPageIndex];
        if (activePage) {
          setOcrText(activePage.ocrText || '');
        }
      }
    } else if (documents.length > 0 && !document) {
      setDocument(documents[0]);
      const activePage = documents[0].pagesList?.[selectedPageIndex];
      if (activePage) {
        setOcrText(activePage.ocrText || '');
      }
    }
  }, [id, documents, selectedPageIndex, document]);

  const activePage = document?.pagesList?.[selectedPageIndex];

  // Trigger real OCR inside WebView Tesseract engine
  const handleExtractText = async () => {
    if (!activePage) return;
    setRunning(true);
    setProgressMsg('Extracting text (OCR)...');

    try {
      const extracted = await ImageProcessor.performOcr(
        activePage.processedUri,
        language.key
      );

      const trimmedText = extracted.trim() || 'No clear text was found on this page.';
      setOcrText(trimmedText);

      // Save OCR result to local database
      if (document) {
        const updatedPages = (document.pagesList || []).map((p, idx) =>
          idx === selectedPageIndex ? { ...p, ocrText: trimmedText } : p
        );
        await updateDocument(document.id, { pagesList: updatedPages });
      }
      
      Alert.alert('OCR Complete', 'Text extracted and indexed successfully!');
    } catch (e: any) {
      Alert.alert('OCR Extraction Failed', e.message || 'Error running Tesseract.js engine.');
    } finally {
      setRunning(false);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(ocrText);
    Alert.alert('Copied', 'Extracted text copied to clipboard.');
  };

  const handleZoomIn = () => {
    setFontSize((prev) => Math.min(prev + 2, 24));
  };

  const handleZoomOut = () => {
    setFontSize((prev) => Math.max(prev - 2, 10));
  };

  // Export extracted text as TXT file
  const handleExportText = async () => {
    if (!ocrText || !document) return;
    try {
      const txtName = document.name.replace(/\.[^/.]+$/, "") + `_Page_${selectedPageIndex + 1}.txt`;
      const txtPath = cacheDirectory + txtName;
      await writeAsStringAsync(txtPath, ocrText, { encoding: EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(txtPath, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Extracted Text',
        });
      } else {
        Alert.alert('Export Failed', 'Native sharing is not supported.');
      }
    } catch (e) {
      Alert.alert('Export Error', 'Failed to generate TXT file.');
    }
  };

  // Save manual text edits to AsyncStorage
  const handleManualTextChange = async (newVal: string) => {
    setOcrText(newVal);
    if (document) {
      const updatedPages = (document.pagesList || []).map((p, idx) =>
        idx === selectedPageIndex ? { ...p, ocrText: newVal } : p
      );
      await updateDocument(document.id, { pagesList: updatedPages });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ backgroundColor: theme.background }} edges={['top']} />

      <Header
        title="OCR Extractor"
        rightActions={[
          {
            icon: 'doc.on.clipboard',
            fallback: '📋',
            onPress: handleCopy,
          },
        ]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Document selector row if accessed standalone */}
        {documents.length > 0 && (
          <View style={styles.documentSelectorCard}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SELECT DOCUMENT</Text>
            <Pressable
              style={[styles.pickerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowDocPicker(true)}
            >
              <Text style={[styles.pickerBtnText, { color: theme.text }]} numberOfLines={1}>
                {document ? document.name : 'Select a document...'}
              </Text>
              <Icon sf="chevron.down" fallback="▼" size={14} color={theme.primary} />
            </Pressable>
          </View>
        )}

        {/* Page selector row */}
        {document && document.pagesList && document.pagesList.length > 1 && (
          <View style={styles.pageSelectSection}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SELECT PAGE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pageScroll}>
              {document.pagesList.map((_, idx) => {
                const isSelected = idx === selectedPageIndex;
                return (
                  <Pressable
                    key={idx}
                    style={[
                      styles.pagePill,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                      isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setSelectedPageIndex(idx)}
                  >
                    <Text style={[styles.pagePillText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                      Page {idx + 1}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Stats and image thumbnail */}
        {activePage && (
          <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
            <View style={[styles.thumbnailWrap, { borderColor: theme.border }]}>
              <Image source={{ uri: activePage.processedUri }} style={styles.thumbnailImage} contentFit="contain" />
            </View>

            <View style={styles.statsInfo}>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Selected Language:</Text>
                <Text style={[styles.statValueDark, { color: theme.text }]}>{language.label}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Character Count:</Text>
                <Text style={[styles.statValueDark, { color: theme.text }]}>{ocrText.length}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Engine Status:</Text>
                <Text style={[styles.statValueTeal, { color: theme.primary }]}>Offline Mode</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action button to trigger extraction if empty */}
        {!ocrText && !running && (
          <View style={styles.emptyContainer}>
            <Icon sf="doc.text.magnifyingglass" fallback="🔍" size={40} color={theme.primary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Text Extracted Yet</Text>
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              Extract text from this page using Tesseract OCR. Supports English, Urdu, and Arabic.
            </Text>
            <PrimaryButton
              label="Start OCR Text Extraction"
              onPress={handleExtractText}
              icon="play.fill"
              iconFallback="▶"
              style={styles.extractBtn}
            />
          </View>
        )}

        {/* Loading progress card */}
        {running && (
          <View style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.progressText, { color: theme.text }]}>{progressMsg}</Text>
          </View>
        )}

        {ocrText && !running && (
          <>
            {/* View tabs */}
            <View style={[styles.tabsRow, { backgroundColor: theme.border }]}>
              <Pressable
                style={[styles.tabBtn, activeTab === 'result' && { backgroundColor: theme.surface }]}
                onPress={() => setActiveTab('result')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'result' ? theme.primary : theme.textSecondary }]}>
                  Extracted Text
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, activeTab === 'compare' && { backgroundColor: theme.surface }]}
                onPress={() => setActiveTab('compare')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'compare' ? theme.primary : theme.textSecondary }]}>
                  Compare View
                </Text>
              </Pressable>
            </View>

            {/* Dynamic tabs layout */}
            {activeTab === 'result' ? (
              <View style={[styles.textAreaCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
                <TextInput
                  style={[styles.textInput, { color: theme.text, fontSize }]}
                  multiline
                  value={ocrText}
                  onChangeText={handleManualTextChange}
                  placeholder="Extracted text is empty..."
                  placeholderTextColor={theme.textSecondary}
                  textAlignVertical="top"
                />
              </View>
            ) : (
              <View style={styles.compareContainer}>
                {/* original image */}
                <View style={[styles.compareBox, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
                  <Text style={[styles.compareLabel, { color: theme.textSecondary }]}>PROCESSED SCAN</Text>
                  {activePage && (
                    <Image
                      source={{ uri: activePage.processedUri }}
                      style={styles.compareImage}
                      contentFit="contain"
                    />
                  )}
                </View>

                {/* extracted text */}
                <View style={[styles.compareBox, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
                  <Text style={[styles.compareLabel, { color: theme.textSecondary }]}>RECOGNIZED TEXT</Text>
                  <ScrollView nestedScrollEnabled style={{ flex: 1 }}>
                    <Text style={[styles.compareTextText, { color: theme.text, fontSize: 11 }]}>
                      {ocrText}
                    </Text>
                  </ScrollView>
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Editor toolbar floating */}
      {ocrText && !running && (
        <View style={[styles.editorToolbar, { backgroundColor: theme.primaryLight, borderTopColor: theme.border }]}>
          <Pressable
            style={[styles.toolbarIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleCopy}
            accessibilityLabel="Copy text"
          >
            <Icon sf="doc.on.clipboard" fallback="📋" size={18} color={theme.primary} />
          </Pressable>

          <View style={styles.fontSizeControls}>
            <Pressable
              style={[styles.toolbarIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handleZoomOut}
              accessibilityLabel="Decrease font size"
            >
              <Icon sf="textformat.size.smaller" fallback="A-" size={14} color={theme.primary} />
            </Pressable>
            <Text style={[styles.fontSizeIndicator, { color: theme.text }]}>{fontSize}pt</Text>
            <Pressable
              style={[styles.toolbarIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handleZoomIn}
              accessibilityLabel="Increase font size"
            >
              <Icon sf="textformat.size.larger" fallback="A+" size={14} color={theme.primary} />
            </Pressable>
          </View>

          {/* Language selector toggle */}
          <Pressable
            style={[styles.languageBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setShowLanguageMenu(true)}
            accessibilityLabel="Select language"
          >
            <Text style={[styles.languageBtnText, { color: theme.primary }]}>{language.label}</Text>
            <Icon sf="chevron.up.chevron.down" fallback="↕" size={12} color={theme.primary} />
          </Pressable>
        </View>
      )}

      {/* Bottom action trigger */}
      <View style={[styles.actionCtaBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        {ocrText ? (
          <View style={styles.footerActionRow}>
            <OutlineButton
              label="Re-Extract OCR"
              onPress={handleExtractText}
              style={{ flex: 1 }}
              loading={running}
            />
            <PrimaryButton
              label="Export Text File"
              onPress={handleExportText}
              icon="square.and.arrow.up"
              iconFallback="↗"
              style={{ flex: 1.5 }}
            />
          </View>
        ) : (
          <OutlineButton
            label="Back to Library"
            onPress={() => router.replace('/home' as any)}
            style={{ width: '100%' }}
          />
        )}
      </View>

      {/* Language Picker BottomSheet */}
      <BottomSheet
        visible={showLanguageMenu}
        onClose={() => setShowLanguageMenu(false)}
        title="Select Recognition Language"
      >
        <ScrollView style={styles.langList}>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.key}
              style={styles.langItem}
              onPress={() => {
                setLanguage(lang);
                setShowLanguageMenu(false);
              }}
            >
              <Icon
                sf={language.key === lang.key ? 'checkmark.circle.fill' : 'circle'}
                fallback={language.key === lang.key ? '✓' : '○'}
                size={18}
                color={theme.primary}
              />
              <Text style={[styles.langItemText, { color: theme.text }]}>{lang.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>

      {/* Document Picker BottomSheet */}
      <BottomSheet
        visible={showDocPicker}
        onClose={() => setShowDocPicker(false)}
        title="Select Document for OCR"
      >
        <ScrollView style={styles.langList}>
          {documents.map((doc) => (
            <Pressable
              key={doc.id}
              style={styles.langItem}
              onPress={() => {
                setDocument(doc);
                setSelectedPageIndex(0);
                setOcrText(doc.pagesList[0]?.ocrText || '');
                setShowDocPicker(false);
              }}
            >
              <Icon
                sf={document?.id === doc.id ? 'checkmark.circle.fill' : 'circle'}
                fallback=""
                size={18}
                color={theme.primary}
              />
              <Text style={[styles.langItemText, { color: theme.text }]} numberOfLines={1}>
                {doc.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>

      {/* Consistent Bottom Tab Bar */}
      <TabBar activeTab="ocr" />
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
    paddingBottom: Spacing.lg,
  },
  pageSelectSection: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginLeft: 2,
  },
  pageScroll: {
    gap: Spacing.xs,
  },
  pagePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pagePillText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  thumbnailWrap: {
    width: 60,
    height: 80,
    borderRadius: Radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  statsInfo: {
    flex: 1,
    gap: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 11.5,
  },
  statValueDark: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  statValueTeal: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
  emptyDescription: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  extractBtn: {
    width: '80%',
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  progressText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: Radius.sm,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.xs,
  },
  tabText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  textAreaCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    height: 320,
  },
  textInput: {
    flex: 1,
    lineHeight: 22,
  },
  compareContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    height: 320,
  },
  compareBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    overflow: 'hidden',
  },
  compareLabel: {
    fontSize: 9,
    fontWeight: '900',
    marginBottom: Spacing.xs,
  },
  compareImage: {
    width: '100%',
    height: '90%',
  },
  compareTextText: {
    lineHeight: 16,
  },
  editorToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  toolbarIconBtn: {
    padding: Spacing.xs,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fontSizeIndicator: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  languageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
    borderWidth: 1,
    gap: Spacing.xxs,
  },
  languageBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
  },
  actionCtaBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  langList: {
    maxHeight: 250,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  langItemText: {
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
  documentSelectorCard: {
    marginBottom: Spacing.md,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  pickerBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    flex: 1,
  },
});
