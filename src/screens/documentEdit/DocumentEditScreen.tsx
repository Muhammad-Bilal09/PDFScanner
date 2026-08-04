import { PageGridItem } from '@/components/document/PageGridItem';
import { DocumentCropView } from '@/components/shared/DocumentCropView';
import { Header } from '@/components/shared/Header';
import { Icon } from '@/components/shared/Icon';
import { OutlineButton } from '@/components/shared/OutlineButton';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { FILTER_OPTIONS } from '@/constants/constant';
import { Shadows } from '@/theme';
import { SliderProps } from '@/types/types';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  Image as RNImage,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './DocumentEditStyle';
import { useDocumentEditScreen } from './useDocumentEditScreen';

const { width: SCREEN_W } = Dimensions.get('window');

function CustomSlider({ label, value, min, max, onChange }: SliderProps) {
  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View style={styles.sliderTrack}>
        <Pressable
          style={styles.sliderStepBtn}
          onPress={() => onChange(Math.max(min, value - 10))}
        >
          <Text style={{ fontWeight: 'bold' }}>-</Text>
        </Pressable>
        <Text style={styles.sliderValText}>{value}</Text>
        <Pressable
          style={styles.sliderStepBtn}
          onPress={() => onChange(Math.min(max, value + 10))}
        >
          <Text style={{ fontWeight: 'bold' }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function DocumentEditScreen() {
  const {
    router,
    theme,
    document,
    activePage,
    setActivePage,
    previewPage,
    setPreviewPage,
    editMode,
    setEditMode,
    cropPoints,
    setCropPoints,
    activeFilter,
    setActiveFilter,
    activeRotation,
    setActiveRotation,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    processing,
    showRenameModal,
    setShowRenameModal,
    renameText,
    setRenameText,
    handleStartReedit,
    handleDeletePage,
    handleRotatePage,
    handleDuplicatePage,
    handleMoveUp,
    handleMoveDown,
    handleAddPages,
    handleSaveReedit,
    handleSaveRename,
  } = useDocumentEditScreen();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ backgroundColor: theme.background }} edges={['top']} />

      <Header
        title="Document Editor"
        onBack={() => router.back()}
        actions={[
          {
            icon: 'square.and.arrow.up',
            fallback: '↗',
            onPress: () =>
              router.push({
                pathname: '/exportShare' as any,
                params: { id: document?.id },
              }),
          },
        ]}
      />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {document && (
          <View
            style={[
              styles.docMetaBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.docTitleRow}>
              <Text style={[styles.docTitleText, { color: theme.text }]}>
                {document.name || document.title || 'Document'}
              </Text>
              <Pressable
                onPress={() => {
                  setRenameText(document.name || document.title || '');
                  setShowRenameModal(true);
                }}
                hitSlop={8}
                style={styles.renameBtn}
              >
                <Icon sf="pencil" fallback="✏️" size={14} color={theme.primary} />
              </Pressable>
            </View>
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                Date: {document.date || 'Today'}
              </Text>
              <View
                style={[styles.dot, { backgroundColor: theme.textSecondary }]}
              />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                Pages: {document.pagesList ? document.pagesList.length : 0}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.toolsRow}>
          <OutlineButton
            label="Add Pages"
            onPress={handleAddPages}
            icon="plus"
            iconFallback="+"
            style={styles.toolBtn}
          />
        </View>

        <View style={styles.gridContainer}>
          {document &&
            document.pagesList &&
            document.pagesList.map((page, index) => (
              <PageGridItem
                key={page.id}
                page={page}
                pageNum={index + 1}
                isFirst={index === 0}
                isLast={
                  index === (document.pagesList ? document.pagesList.length - 1 : 0)
                }
                onPress={() => setPreviewPage(page)}
                onDelete={() => handleDeletePage(page.id)}
                onRotate={() => handleRotatePage(page.id)}
                onDuplicate={() => handleDuplicatePage(page)}
                onPressMoveUp={() => handleMoveUp(index)}
                onPressMoveDown={() => handleMoveDown(index)}
              />
            ))}
        </View>
      </ScrollView>

      {/* Page Edit Overlay */}
      {activePage && editMode && (
        <View
          style={[styles.reeditOverlay, { backgroundColor: theme.background }]}
        >
          <SafeAreaView style={{ backgroundColor: theme.background }} edges={['top']} />

          <View
            style={[
              styles.reeditHeader,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Pressable
              onPress={() => {
                setActivePage(null);
                setEditMode(null);
              }}
              style={styles.headerBtn}
            >
              <Icon sf="xmark" fallback="✕" size={18} color={theme.text} />
            </Pressable>
            <Text style={[styles.reeditTitle, { color: theme.text }]}>
              {editMode === 'crop'
                ? 'Adjust Page Corners'
                : editMode === 'filter'
                  ? 'Apply Filters'
                  : 'Brightness & Contrast'}
            </Text>
            <Pressable
              onPress={handleSaveReedit}
              disabled={processing}
              style={[styles.headerBtn, { backgroundColor: theme.primaryLight }]}
            >
              {processing ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Icon sf="checkmark" fallback="✓" size={18} color={theme.primary} />
              )}
            </Pressable>
          </View>

          <View style={styles.reeditBody}>
            {editMode === 'crop' ? (
              <DocumentCropView
                imageUri={activePage.originalUri}
                initialPoints={cropPoints}
                onCropChange={setCropPoints}
                imageWidth={SCREEN_W}
                imageHeight={SCREEN_W * 1.33}
              />
            ) : (
              <View style={styles.imagePreviewWrap}>
                <RNImage
                  source={{
                    uri:
                      activePage.processedUri ||
                      activePage.croppedUri ||
                      activePage.originalUri,
                  }}
                  style={[
                    styles.previewImage,
                    { transform: [{ rotate: `${activeRotation}deg` }] },
                  ]}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>

          <View
            style={[
              styles.reeditFooter,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {editMode === 'filter' && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersScroll}
              >
                {FILTER_OPTIONS.map((f) => {
                  const isSelected = activeFilter === f.id;
                  return (
                    <Pressable
                      key={f.id}
                      style={[
                        styles.filterPill,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                        isSelected && {
                          borderColor: theme.primary,
                          backgroundColor: theme.primaryLight,
                        },
                      ]}
                      onPress={() => setActiveFilter(f.id as any)}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          {
                            color: isSelected
                              ? theme.primary
                              : theme.textSecondary,
                          },
                        ]}
                      >
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {editMode === 'adjust' && (
              <View style={styles.slidersContainer}>
                <CustomSlider
                  label="Brightness"
                  value={brightness}
                  min={-50}
                  max={50}
                  onChange={setBrightness}
                  onComplete={() => { }}
                />
                <CustomSlider
                  label="Contrast"
                  value={contrast}
                  min={-50}
                  max={50}
                  onChange={setContrast}
                  onComplete={() => { }}
                />
              </View>
            )}

            <View style={styles.actionsBar}>
              <Pressable
                style={styles.actionIconBtn}
                onPress={() => setEditMode('crop')}
              >
                <Icon
                  sf="crop"
                  fallback="✂️"
                  size={20}
                  color={editMode === 'crop' ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.actionIconText,
                    {
                      color:
                        editMode === 'crop'
                          ? theme.primary
                          : theme.textSecondary,
                    },
                  ]}
                >
                  Crop
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionIconBtn}
                onPress={() => setEditMode('filter')}
              >
                <Icon
                  sf="wand.and.stars"
                  fallback="✨"
                  size={20}
                  color={
                    editMode === 'filter' ? theme.primary : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.actionIconText,
                    {
                      color:
                        editMode === 'filter'
                          ? theme.primary
                          : theme.textSecondary,
                    },
                  ]}
                >
                  Filters
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionIconBtn}
                onPress={() => setActiveRotation((r) => (r + 90) % 360)}
              >
                <Icon
                  sf="rotate.right"
                  fallback="🔄"
                  size={20}
                  color={theme.textSecondary}
                />
                <Text
                  style={[
                    styles.actionIconText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Rotate
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.md,
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Rename Document
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <OutlineButton
                label="Cancel"
                onPress={() => setShowRenameModal(false)}
                style={styles.modalBtn}
              />
              <PrimaryButton
                label="Save"
                onPress={handleSaveRename}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Image Preview Modal */}
      <Modal
        visible={!!previewPage}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setPreviewPage(null)}
      >
        {previewPage && (
          <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
            <SafeAreaView style={{ backgroundColor: '#0A0A0A' }} edges={['top']}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Pressable
                  onPress={() => setPreviewPage(null)}
                  style={{ padding: 8 }}
                  hitSlop={12}
                >
                  <Icon sf="xmark" fallback="✕" size={20} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  onPress={() => handleStartReedit(previewPage)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: theme.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Icon sf="crop" fallback="✂️" size={16} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                    Edit Page
                  </Text>
                </Pressable>
              </View>
            </SafeAreaView>

            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 8 }}>
              <RNImage
                source={{
                  uri:
                    previewPage.processedUri ||
                    previewPage.croppedUri ||
                    previewPage.originalUri,
                }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

export default DocumentEditScreen;
