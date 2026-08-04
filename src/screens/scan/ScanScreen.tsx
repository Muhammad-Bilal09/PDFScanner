import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Image as RNImage,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentCropView } from '@/components/shared/DocumentCropView';
import { Icon } from '@/components/shared/Icon';
import { LoadingView } from '@/components/shared/LoadingView';
import { OutlineButton } from '@/components/shared/OutlineButton';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { FILTER_OPTIONS } from '@/constants/constant';
import { FilterType } from '@/types/types';
import { useScanScreen } from './useScanScreen';
import { styles } from './ScanStyle';

export function ScanScreen() {
  const {
    router,
    theme,
    scanMode,
    setScanMode,
    viewState,
    setViewState,
    processing,
    processingMessage,
    currentOriginalUri,
    currentWarpedUri,
    currentCorners,
    setCurrentCorners,
    currentFilter,
    currentRotation,
    imageSize,
    batchPages,
    batchReviewIndex,
    handleCapture,
    handlePickFromGallery,
    handleApplyFilter,
    handleRotate,
    handleSaveSingleScan,
    handleKeepBatchPage,
    handleSelectBatchPage,
    handleDeleteBatchPage,
    handleSaveAllBatch,
    resetScanState,
  } = useScanScreen();

  if (processing) {
    return <LoadingView fullscreen message={processingMessage} />;
  }

  if (viewState === 'camera') {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <SafeAreaView style={{ backgroundColor: theme.background }} edges={['top']} />
        
        <View
          style={[
            styles.reviewHeader,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Pressable
            style={styles.headerIconButton}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Icon sf="arrow.left" fallback="←" size={20} color={theme.text} />
          </Pressable>
          <Text style={[styles.reviewTitle, { color: theme.text }]}>
            Scanly Document Scanner
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.permissionContainer}>
          <Image
            source={require('@/assets/images/expo-logo.png')}
            style={{ width: 96, height: 96, borderRadius: 24, marginBottom: 20 }}
            contentFit="contain"
          />
          
          {/* <Text style={[styles.permissionTitle, { color: theme.text }]}>
            Document Scanner
          </Text>
          <Text
            style={[styles.permissionDesc, { color: theme.textSecondary }]}
          >
            Use our smart document scanner library to scan paper documents, receipts, and contracts with auto-edge detection and filter enhancement.
          </Text> */}

          <View style={{ width: '100%', gap: 12, marginTop: 24 }}>
            <PrimaryButton
              label="Start Scan"
              onPress={handleCapture}
              icon="camera.fill"
              iconFallback="📷"
            />
            <OutlineButton
              label="Import from Photo Gallery"
              onPress={handlePickFromGallery}
              icon="photo"
              iconFallback="🖼"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.reviewRoot, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ backgroundColor: theme.background }} edges={['top']} />

      <View
        style={[
          styles.reviewHeader,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Pressable
          style={styles.headerIconButton}
          onPress={resetScanState}
          hitSlop={12}
        >
          <Icon
            sf="arrow.left"
            fallback="←"
            size={20}
            color={theme.text}
          />
        </Pressable>
        <Text style={[styles.reviewTitle, { color: theme.text }]}>
          {scanMode === 'batch'
            ? `Page ${batchReviewIndex + 1} of ${Math.max(
                batchPages.length,
                batchReviewIndex + 1
              )}`
            : 'Crop & Filter Page'}
        </Text>
        {scanMode === 'batch' && (
          <Pressable
            style={styles.headerIconButton}
            onPress={() => handleDeleteBatchPage(batchReviewIndex)}
            hitSlop={12}
          >
            <Icon sf="trash" fallback="🗑" size={20} color={theme.error} />
          </Pressable>
        )}
      </View>

      <View
        style={[
          styles.filtersContainer,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {FILTER_OPTIONS.map((f) => {
            const isActive = currentFilter === f.id;
            return (
              <Pressable
                key={f.id}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                  isActive && {
                    borderColor: theme.primary,
                    backgroundColor: theme.primaryLight,
                  },
                ]}
                onPress={() => handleApplyFilter(f.id as FilterType)}
              >
                <View
                  style={[styles.filterColorDot, { backgroundColor: f.color }]}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isActive ? theme.primary : theme.textSecondary,
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.reviewBody}>
        {currentOriginalUri ? (
          <View style={styles.cropContainer}>
            <DocumentCropView
              imageUri={currentOriginalUri}
              initialPoints={currentCorners}
              onCropChange={setCurrentCorners}
              imageWidth={imageSize.width}
              imageHeight={imageSize.height}
            />
          </View>
        ) : (
          <LoadingView message="Loading page preview..." />
        )}
      </View>

      <View
        style={[
          styles.reviewFooter,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.quickActionsRow}>
          <Pressable style={styles.actionIconBtn} onPress={handleRotate}>
            <Icon
              sf="rotate.right"
              fallback="🔄"
              size={20}
              color={theme.primary}
            />
            <Text
              style={[styles.actionIconLabel, { color: theme.textSecondary }]}
            >
              Rotate 90°
            </Text>
          </Pressable>
        </View>

        {scanMode === 'batch' && batchPages.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.batchBarScroll}
          >
            {batchPages.map((page, idx) => {
              const isSelected = idx === batchReviewIndex;
              return (
                <Pressable
                  key={page.id}
                  style={[
                    styles.batchThumbItem,
                    { borderColor: theme.border },
                    isSelected && { borderColor: theme.primary, borderWidth: 2 },
                  ]}
                  onPress={() => handleSelectBatchPage(idx)}
                >
                  <Image
                    source={{
                      uri: page.processedUri || page.originalUri,
                    }}
                    style={styles.batchThumbImage}
                  />
                  <View style={styles.batchThumbBadge}>
                    <Text style={styles.batchThumbNum}>{idx + 1}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.ctaButtonsRow}>
          {scanMode === 'single' ? (
            <>
              <OutlineButton
                label="Retake"
                onPress={resetScanState}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                label="Save Document"
                onPress={handleSaveSingleScan}
                loading={processing}
                style={{ flex: 1.5 }}
              />
            </>
          ) : (
            <>
              <OutlineButton
                label="Keep & Scan Next"
                onPress={handleKeepBatchPage}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                label={`Finish Batch (${batchPages.length + 1})`}
                onPress={async () => {
                  handleKeepBatchPage();
                  await handleSaveAllBatch();
                }}
                loading={processing}
                style={{ flex: 1.5 }}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

export default ScanScreen;
