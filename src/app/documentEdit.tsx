import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Modal,
  TextInput,
  Image as RNImage,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { useDocuments } from '@/hooks/use-documents';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius, Typography, Shadows } from '@/theme';
import { Header } from '@/components/shared/Header';
import { Icon } from '@/components/shared/Icon';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { OutlineButton } from '@/components/shared/OutlineButton';
import { DocumentItemType, PageItemType } from '@/components/shared/DocumentCard';
import { DocumentCropView } from '@/components/shared/DocumentCropView';
import { ImageProcessor, Point } from '@/services/processor';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_ITEM_W = (SCREEN_W - 56) / 2;

const FILTER_OPTIONS = [
  { id: 'original', label: 'Original', color: '#FDFBF7' },
  { id: 'auto', label: 'Auto', color: '#E0F7FA' },
  { id: 'document', label: 'Document', color: '#E0F2F1' },
  { id: 'magic', label: 'Magic Color', color: '#EBEFF5' },
  { id: 'color', label: 'Color', color: '#FFF8E1' },
  { id: 'bw', label: 'Clean B&W', color: '#FFFFFF' },
  { id: 'gray', label: 'Grayscale', color: '#EEEEEE' },
  { id: 'high_contrast', label: 'Contrast', color: '#E0E0E0' },
  { id: 'receipt', label: 'Receipt', color: '#F5F5F5' },
];

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  onComplete: (val: number) => void;
}

function CustomSlider({ label, value, min, max, onChange, onComplete }: SliderProps) {
  const theme = useTheme();
  const trackRef = useRef<View>(null);
  
  const handleTouch = (evt: any) => {
    const pageX = evt.nativeEvent.pageX;
    trackRef.current?.measure((x, y, width, height, px, py) => {
      if (!width) return;
      const relativeX = Math.max(0, Math.min(width, pageX - px));
      const percentage = relativeX / width;
      const rawValue = min + percentage * (max - min);
      onChange(Math.round(rawValue));
    });
  };

  const handleRelease = (evt: any) => {
    const pageX = evt.nativeEvent.pageX;
    trackRef.current?.measure((x, y, width, height, px, py) => {
      if (!width) return;
      const relativeX = Math.max(0, Math.min(width, pageX - px));
      const percentage = relativeX / width;
      const rawValue = min + percentage * (max - min);
      onComplete(Math.round(rawValue));
    });
  };

  const filledPercent = `${((value - min) / (max - min)) * 100}%` as any;

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderLabelRow}>
        <Text style={styles.sliderLabelText}>{label}</Text>
        <Text style={[styles.sliderValueText, { color: theme.primary }]}>
          {value > 0 ? `+${value}` : value}
        </Text>
      </View>
      <View 
        ref={trackRef}
        style={styles.sliderTrackWrapper}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
        onResponderRelease={handleRelease}
      >
        <View style={styles.sliderTrackBg}>
          <View style={[styles.sliderTrackFill, { width: filledPercent, backgroundColor: theme.primary }]} />
        </View>
        <View style={[styles.sliderThumb, { left: filledPercent, borderColor: theme.primary }]} />
      </View>
    </View>
  );
}

interface PageGridItemProps {
  page: PageItemType;
  pageNum: number;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
  onDelete: () => void;
  onRotate: () => void;
  onDuplicate: () => void;
  onPressMoveUp: () => void;
  onPressMoveDown: () => void;
}

function PageGridItem({
  page,
  pageNum,
  isFirst,
  isLast,
  onPress,
  onDelete,
  onRotate,
  onDuplicate,
  onPressMoveUp,
  onPressMoveDown,
}: PageGridItemProps) {
  const theme = useTheme();

  return (
    <View style={[styles.gridItem, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
      {/* Page Header */}
      <View style={styles.gridItemHeader}>
        <Text style={[styles.pageNumText, { color: theme.text }]}>Page {pageNum}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={onDuplicate} hitSlop={6} accessibilityLabel="Duplicate page">
            <Icon sf="doc.on.doc" fallback="⎘" size={14} color={theme.textSecondary} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={6} accessibilityLabel="Delete page">
            <Icon sf="trash" fallback="🗑" size={14} color={theme.error} />
          </Pressable>
        </View>
      </View>

      {/* Image Preview */}
      <Pressable onPress={onPress} style={[styles.gridItemBody, { borderColor: theme.border }]}>
        <Image
          source={{ uri: page.processedUri }}
          style={[
            styles.pageThumbnailImage,
            { transform: [{ rotate: `${page.rotation}deg` }] },
          ]}
          contentFit="contain"
        />
        <View style={styles.editPageHint}>
          <Icon sf="crop" fallback="⛶" size={12} color="#FFFFFF" />
          <Text style={styles.editPageHintText}>Tap to Edit</Text>
        </View>
      </Pressable>

      {/* Page Actions Footer (Rotate and Rearrange) */}
      <View style={styles.gridItemFooter}>
        <Pressable onPress={onRotate} hitSlop={8} style={styles.footerActionBtn}>
          <Icon sf="arrow.clockwise" fallback="↻" size={12} color={theme.primary} />
          <Text style={[styles.footerActionBtnText, { color: theme.primary }]}>Rotate</Text>
        </Pressable>

        <View style={styles.rearrangeControls}>
          <Pressable
            onPress={onPressMoveUp}
            disabled={isFirst}
            hitSlop={6}
            style={[styles.arrowBtn, isFirst && styles.disabledArrow]}
          >
            <Icon sf="chevron.left" fallback="◀" size={12} color={isFirst ? theme.inactive : theme.text} />
          </Pressable>
          <Pressable
            onPress={onPressMoveDown}
            disabled={isLast}
            hitSlop={6}
            style={[styles.arrowBtn, isLast && styles.disabledArrow]}
          >
            <Icon sf="chevron.right" fallback="▶" size={12} color={isLast ? theme.inactive : theme.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function DocumentEditScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { documents, updateDocument, renameDocument } = useDocuments();

  const [document, setDocument] = useState<DocumentItemType | null>(null);
  
  // Re-edit states
  const [editorState, setEditorState] = useState<'grid' | 'cropping' | 'review'>('grid');
  const [activePage, setActivePage] = useState<PageItemType | null>(null);
  const [imageWidth, setImageWidth] = useState(800);
  const [imageHeight, setImageHeight] = useState(1000);
  const [cropPoints, setCropPoints] = useState<Point[]>([]);
  
  // Review modifications
  const [activeFilter, setActiveFilter] = useState('magic');
  const [activeRotation, setActiveRotation] = useState(0);
  const [warpedPreviewUri, setWarpedPreviewUri] = useState<string | null>(null);
  const [baseWarpedUri, setBaseWarpedUri] = useState<string | null>(null);
  
  // Manual adjustments state
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [sharpness, setSharpness] = useState(0);

  // Review sub-tab: 'filter' | 'adjust'
  const [reviewTab, setReviewTab] = useState<'filter' | 'adjust'>('filter');

  // Renaming state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameText, setRenameText] = useState('');

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      setDocument({
        ...doc,
        pagesList: doc.pagesList || [],
      });
    }
  }, [id, documents]);

  // Handle page deletion
  const handleDeletePage = (pageId: string) => {
    if (!document) return;
    if (document.pagesList.length <= 1) {
      Alert.alert('Cannot Delete', 'A scanned document must contain at least one page.');
      return;
    }

    Alert.alert('Delete Page', 'Are you sure you want to remove this page?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedPages = document.pagesList.filter((p) => p.id !== pageId);
          await updateDocument(document.id, {
            pages: updatedPages.length,
            pagesList: updatedPages,
          });
        },
      },
    ]);
  };

  // Handle page rotation
  const handleRotatePage = async (pageId: string) => {
    if (!document) return;
    const updatedPages = document.pagesList.map((p) =>
      p.id === pageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    );
    await updateDocument(document.id, { pagesList: updatedPages });
  };

  // Duplicate a page
  const handleDuplicatePage = async (page: PageItemType) => {
    if (!document) return;
    const duplicatedPage: PageItemType = {
      ...page,
      id: Math.random().toString(36).substring(2, 9),
    };
    
    const idx = document.pagesList.findIndex((p) => p.id === page.id);
    const updatedPages = [...document.pagesList];
    updatedPages.splice(idx + 1, 0, duplicatedPage);

    await updateDocument(document.id, {
      pages: updatedPages.length,
      pagesList: updatedPages,
    });
  };

  // Rearrange order: Move Left (Up)
  const handleMoveUp = async (idx: number) => {
    if (!document || idx === 0) return;
    const updatedPages = [...document.pagesList];
    const temp = updatedPages[idx];
    updatedPages[idx] = updatedPages[idx - 1];
    updatedPages[idx - 1] = temp;
    await updateDocument(document.id, { pagesList: updatedPages });
  };

  // Rearrange order: Move Right (Down)
  const handleMoveDown = async (idx: number) => {
    if (!document || idx === document.pagesList.length - 1) return;
    const updatedPages = [...document.pagesList];
    const temp = updatedPages[idx];
    updatedPages[idx] = updatedPages[idx + 1];
    updatedPages[idx + 1] = temp;
    await updateDocument(document.id, { pagesList: updatedPages });
  };

  // Open Re-Crop Flow for selected page
  const handleStartReedit = (page: PageItemType) => {
    setActivePage(page);
    setCropPoints(page.corners);
    setActiveFilter(page.filter);
    setActiveRotation(page.rotation);
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setSharpness(0);
    setReviewTab('filter');
    
    RNImage.getSize(
      page.originalUri,
      (w: number, h: number) => {
        setImageWidth(w);
        setImageHeight(h);
        setEditorState('cropping');
      },
      () => {
        setImageWidth(800);
        setImageHeight(1000);
        setEditorState('cropping');
      }
    );
  };

  // Warp perspective save handler
  const handleReeditCropSave = async (adjustedCorners: Point[]) => {
    if (!activePage) return;
    setProcessing(true);
    setCropPoints(adjustedCorners);

    try {
      const warpedPath = await ImageProcessor.warpAndEnhance(
        activePage.originalUri,
        adjustedCorners,
        activeFilter
      );
      setWarpedPreviewUri(warpedPath);
      setBaseWarpedUri(warpedPath);
      setEditorState('review');
    } catch (e: any) {
      Alert.alert('Processing Error', e.message || 'Warp perspective failed.');
    } finally {
      setProcessing(false);
    }
  };

  // Apply filters on edit view
  const handleReeditFilterChange = async (filterId: string) => {
    if (!activePage) return;
    setActiveFilter(filterId);
    setProcessing(true);

    try {
      const warpedPath = await ImageProcessor.warpAndEnhance(
        activePage.originalUri,
        cropPoints,
        filterId
      );
      setWarpedPreviewUri(warpedPath);
      setBaseWarpedUri(warpedPath);
      setBrightness(0);
      setContrast(0);
      setSaturation(0);
      setSharpness(0);
    } catch (e) {
      Alert.alert('Filter Error', 'Failed to update page enhancements.');
    } finally {
      setProcessing(false);
    }
  };

  // Apply sliders modifications (brightness, contrast, saturation, sharpness)
  const applyImageAdjustments = async (b: number, c: number, s: number, sh: number) => {
    if (!baseWarpedUri) return;
    setProcessing(true);

    try {
      const adjustedPath = await ImageProcessor.adjustImage(baseWarpedUri, {
        brightness: b,
        contrast: c,
        saturation: s,
        sharpness: sh,
      });
      setWarpedPreviewUri(adjustedPath);
    } catch (e) {
      console.warn('[Editor] Saturation/Brightness adjustments failed:', e);
    } finally {
      setProcessing(false);
    }
  };

  // Confirm changes and save locally
  const handleSaveReedit = async () => {
    if (!document || !activePage || !warpedPreviewUri) return;
    setProcessing(true);

    try {
      const updatedPages = document.pagesList.map((p) =>
        p.id === activePage.id
          ? {
              ...p,
              processedUri: warpedPreviewUri,
              corners: cropPoints,
              filter: activeFilter,
              rotation: activeRotation,
            }
          : p
      );

      await updateDocument(document.id, { pagesList: updatedPages });
      setEditorState('grid');
      setActivePage(null);
      setWarpedPreviewUri(null);
      setBaseWarpedUri(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to save updates to page.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRenameSave = async () => {
    if (!document || !renameText.trim()) return;
    try {
      await renameDocument(document.id, renameText.trim());
      setShowRenameModal(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to rename document.');
    }
  };

  // Direct append new scans
  const handleAddPages = () => {
    if (!document) return;
    router.replace({
      pathname: '/scan' as any,
      params: { appendDocId: document.id },
    });
  };

  if (editorState === 'cropping' && activePage) {
    return (
      <DocumentCropView
        imageUri={activePage.originalUri}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        initialPoints={cropPoints}
        onCancel={() => setEditorState('grid')}
        onSave={handleReeditCropSave}
      />
    );
  }

  if (editorState === 'review' && activePage && warpedPreviewUri) {
    return (
      <View style={[styles.root, { backgroundColor: '#121212' }]}>
        <SafeAreaView style={styles.reeditContainer} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.reeditHeader}>
            <Pressable style={styles.headerBtn} onPress={() => setEditorState('cropping')}>
              <Icon sf="chevron.left" fallback="←" size={16} color={theme.primary} />
              <Text style={{ color: theme.primary, fontWeight: '700' }}>Back to Crop</Text>
            </Pressable>
            <Text style={styles.reeditTitle}>Adjust Page</Text>
            <View style={{ width: 80 }} />
          </View>

          {/* Warp Preview */}
          <View style={styles.previewCanvas}>
            <View style={[styles.reeditPreviewFrame, Shadows.md]}>
              <Image
                source={{ uri: warpedPreviewUri }}
                style={[
                  styles.reeditPreviewImage,
                  { transform: [{ rotate: `${activeRotation}deg` }] },
                ]}
                contentFit="contain"
              />
            </View>
          </View>

          {/* Rotate action */}
          <View style={styles.reeditActionsRow}>
            <Pressable
              style={styles.reeditActionBadge}
              onPress={() => setActiveRotation((r) => (r + 90) % 360)}
            >
              <Icon sf="rotate.right" fallback="↻" size={14} color="#FFFFFF" />
              <Text style={styles.reeditActionBadgeText}>Rotate 90°</Text>
            </Pressable>
          </View>

          {/* Segmented controls for Filters vs Adjustments */}
          <View style={styles.reviewTabContainer}>
            <Pressable
              style={[styles.reviewTabBtn, reviewTab === 'filter' && styles.reviewTabActive]}
              onPress={() => setReviewTab('filter')}
            >
              <Text style={[styles.reviewTabText, reviewTab === 'filter' && styles.reviewTabActiveText]}>Filters</Text>
            </Pressable>
            <Pressable
              style={[styles.reviewTabBtn, reviewTab === 'adjust' && styles.reviewTabActive]}
              onPress={() => setReviewTab('adjust')}
            >
              <Text style={[styles.reviewTabText, reviewTab === 'adjust' && styles.reviewTabActiveText]}>Adjust</Text>
            </Pressable>
          </View>

          {/* Sub-panel filter list */}
          {reviewTab === 'filter' ? (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>SELECT ENHANCEMENT FILTER</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {FILTER_OPTIONS.map((opt) => {
                  const isSelected = opt.id === activeFilter;
                  return (
                    <Pressable
                      key={opt.id}
                      style={[
                        styles.filterCard,
                        isSelected && { borderColor: theme.primary, backgroundColor: 'rgba(0,191,165,0.08)' },
                      ]}
                      onPress={() => handleReeditFilterChange(opt.id)}
                    >
                      <View style={[styles.filterPreview, { backgroundColor: opt.color }]} />
                      <Text style={[styles.filterCardText, isSelected && { color: theme.primary }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            // Slider adjustments panel
            <View style={styles.adjustSection}>
              <CustomSlider
                label="Brightness"
                value={brightness}
                min={-100}
                max={100}
                onChange={setBrightness}
                onComplete={(val) => {
                  setBrightness(val);
                  applyImageAdjustments(val, contrast, saturation, sharpness);
                }}
              />
              <CustomSlider
                label="Contrast"
                value={contrast}
                min={-100}
                max={100}
                onChange={setContrast}
                onComplete={(val) => {
                  setContrast(val);
                  applyImageAdjustments(brightness, val, saturation, sharpness);
                }}
              />
              <CustomSlider
                label="Saturation"
                value={saturation}
                min={-100}
                max={100}
                onChange={setSaturation}
                onComplete={(val) => {
                  setSaturation(val);
                  applyImageAdjustments(brightness, contrast, val, sharpness);
                }}
              />
              <CustomSlider
                label="Sharpness"
                value={sharpness}
                min={0}
                max={100}
                onChange={setSharpness}
                onComplete={(val) => {
                  setSharpness(val);
                  applyImageAdjustments(brightness, contrast, saturation, val);
                }}
              />
            </View>
          )}

          {/* Save re-edit buttons */}
          <View style={styles.reeditFooter}>
            <OutlineButton
              label="Cancel"
              onPress={() => setEditorState('grid')}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              label="Save Changes"
              onPress={handleSaveReedit}
              style={{ flex: 1.5 }}
            />
          </View>
        </SafeAreaView>

        {processing && (
          <View style={styles.globalLoader}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ backgroundColor: theme.background }} edges={['top']} />

      <Header
        title="Document Editor"
        rightActions={[
          {
            icon: 'square.and.arrow.up',
            fallback: '↗',
            onPress: () => router.push({ pathname: '/exportShare' as any, params: { id } }),
          },
        ]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {document && (
          <View style={[styles.docInfoCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
            <View style={styles.docTitleRow}>
              <Icon sf="doc.text.fill" fallback="📄" size={20} color={theme.primary} />
              <Text style={[styles.docTitleText, { color: theme.text }]} numberOfLines={1}>
                {document.name}
              </Text>
              <Pressable
                onPress={() => {
                  setRenameText(document.name);
                  setShowRenameModal(true);
                }}
                hitSlop={8}
                style={styles.renameBtn}
              >
                <Icon sf="pencil" fallback="✏️" size={14} color={theme.primary} />
              </Pressable>
            </View>
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>Date: {document.date}</Text>
              <View style={[styles.dot, { backgroundColor: theme.textSecondary }]} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>Pages: {document.pagesList.length}</Text>
            </View>
          </View>
        )}

        {/* Global actions bar */}
        <View style={styles.toolsRow}>
          <OutlineButton
            label="Add Pages"
            onPress={handleAddPages}
            icon="plus"
            iconFallback="+"
            style={styles.toolBtn}
          />
          <PrimaryButton
            label="Extract OCR"
            onPress={() => router.push({ pathname: '/ocrRecognition' as any, params: { id } })}
            icon="text.viewfinder"
            iconFallback="T"
            style={styles.toolBtn}
          />
        </View>

        {/* Scanned Pages grid view */}
        <View style={styles.gridContainer}>
          {document && document.pagesList && document.pagesList.map((page, index) => (
            <PageGridItem
              key={page.id}
              page={page}
              pageNum={index + 1}
              isFirst={index === 0}
              isLast={index === document.pagesList.length - 1}
              onPress={() => handleStartReedit(page)}
              onDelete={() => handleDeletePage(page.id)}
              onRotate={() => handleRotatePage(page.id)}
              onDuplicate={() => handleDuplicatePage(page)}
              onPressMoveUp={() => handleMoveUp(index)}
              onPressMoveDown={() => handleMoveDown(index)}
            />
          ))}

          {/* Scan next page insert button */}
          <Pressable
            style={[styles.insertCard, { borderColor: theme.border }]}
            onPress={handleAddPages}
          >
            <View style={[styles.insertCircle, { backgroundColor: theme.primaryLight }]}>
              <Icon sf="camera.fill" fallback="+" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.insertText, { color: theme.textSecondary }]}>Scan Next Page</Text>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Export CTA Bar */}
      <View style={[styles.actionCtaBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <OutlineButton
          label="Back to Library"
          onPress={() => router.replace('/home' as any)}
          style={styles.ctaBtn}
        />
        <PrimaryButton
          label="Export PDF"
          onPress={() => router.push({ pathname: '/exportShare' as any, params: { id } })}
          icon="square.and.arrow.up"
          iconFallback="↗"
          style={styles.ctaBtn}
        />
      </View>

      {/* Rename Dialog Modal */}
      <Modal visible={showRenameModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Rename Document</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <OutlineButton
                label="Cancel"
                onPress={() => setShowRenameModal(false)}
                style={styles.modalBtn}
              />
              <PrimaryButton
                label="Rename"
                onPress={handleRenameSave}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  docInfoCard: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  docTitleText: {
    fontSize: Typography.sizes.md,
    fontWeight: '800',
    flex: 1,
  },
  renameBtn: {
    padding: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metaText: {
    fontSize: Typography.sizes.xs,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: Radius.full,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  toolBtn: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  gridItem: {
    width: GRID_ITEM_W,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  gridItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageNumText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gridItemBody: {
    height: 160,
    backgroundColor: '#1E1E1E',
    borderRadius: Radius.xs,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  editPageHint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  editPageHintText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
  },
  gridItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  footerActionBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rearrangeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  arrowBtn: {
    padding: 3,
    borderRadius: Radius.xs,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  disabledArrow: {
    opacity: 0.15,
  },
  insertCard: {
    width: GRID_ITEM_W,
    height: 245,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  insertCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insertText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
  },
  actionCtaBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaBtn: {
    flex: 1,
  },

  /* Re-edit Overlay screen */
  reeditContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  reeditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reeditTitle: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: '800',
  },
  previewCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  reeditPreviewFrame: {
    width: SCREEN_W - 60,
    height: (SCREEN_W - 60) * 1.414,
    backgroundColor: '#000',
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  reeditPreviewImage: {
    width: '100%',
    height: '100%',
  },
  reeditActionsRow: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  reeditActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: Spacing.xs,
  },
  reeditActionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.md,
    marginHorizontal: Spacing.md,
    padding: 3,
  },
  reviewTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewTabActive: {
    backgroundColor: '#00BFA5',
  },
  reviewTabText: {
    color: '#A0A0A0',
    fontWeight: '700',
    fontSize: 11,
  },
  reviewTabActiveText: {
    color: '#FFFFFF',
  },
  filterSection: {
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  filterSectionTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  filterCard: {
    width: 65,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: Radius.xs,
    padding: Spacing.xs,
    gap: 4,
  },
  filterPreview: {
    width: '100%',
    height: 28,
    borderRadius: Radius.xs - 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  filterCardText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  adjustSection: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  sliderContainer: {
    width: '100%',
    gap: Spacing.xs,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabelText: {
    color: '#E0E0E0',
    fontSize: 11,
    fontWeight: '700',
  },
  sliderValueText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sliderTrackWrapper: {
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333333',
    width: '100%',
    overflow: 'hidden',
  },
  sliderTrackFill: {
    height: '100%',
  },
  sliderThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    marginTop: -8,
    top: '50%',
    marginLeft: -8,
  },
  reeditFooter: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  globalLoader: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },

  /* Rename modal styles */
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: SCREEN_W - 48,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: '800',
  },
  modalInput: {
    height: 44,
    borderRadius: Radius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.sizes.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalBtn: {
    flex: 1,
  },
});
