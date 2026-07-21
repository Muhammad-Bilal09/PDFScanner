import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Polygon } from 'react-native-svg';
let DocumentScanner: any = null;
try {
  DocumentScanner = require('react-native-document-scanner-plugin').default || require('react-native-document-scanner-plugin');
} catch (e) {
  // Native module not loaded or not linked in the current binary
}

import { PageItemType } from '@/components/shared/DocumentCard';
import { DocumentCropView } from '@/components/shared/DocumentCropView';
import { Icon } from '@/components/shared/Icon';
import { OutlineButton } from '@/components/shared/OutlineButton';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { useDocuments } from '@/hooks/use-documents';
import { useTheme } from '@/hooks/use-theme';
import { ImageProcessor, Point } from '@/services/processor';
import { Radius, Shadows, Spacing, Typography } from '@/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Check if native scanner plugin is compiled in (Development Build)
const isNativeScannerAvailable = typeof DocumentScanner?.scanDocument === 'function';

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ScanScreen() {
  const router = useRouter();
  const { importUri, width, height, appendDocId } = useLocalSearchParams<{
    importUri?: string;
    width?: string;
    height?: string;
    appendDocId?: string;
  }>();
  const theme = useTheme();
  const { documents, addDocument, updateDocument } = useDocuments();
  const [permission, requestPermission] = useCameraPermissions();

  // Screen layout size
  const [viewfinderSize, setViewfinderSize] = useState({ width: SCREEN_W, height: SCREEN_H - 240 });

  // View states: 'camera' | 'cropping' | 'review'
  const [viewState, setViewState] = useState<'camera' | 'cropping' | 'review'>('camera');

  // Capture configurations
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [zoom, setZoom] = useState(0);
  const [showGrid, setShowGrid] = useState(false);

  // Active page coordinates and source URIs
  const [currentOriginalUri, setCurrentOriginalUri] = useState<string | null>(null);
  const [currentWarpedUri, setCurrentWarpedUri] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState<number>(800);
  const [imageHeight, setImageHeight] = useState<number>(1000);
  const [currentCorners, setCurrentCorners] = useState<Point[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string>('magic');
  const [currentRotation, setCurrentRotation] = useState<number>(0);

  // Batch multi-page scanning states
  const [batchPages, setBatchPages] = useState<PageItemType[]>([]);
  const [batchReviewIndex, setBatchReviewIndex] = useState<number>(0);

  // Auto-capture & detection feedback states
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(false);
  const [guidancePrompt, setGuidancePrompt] = useState('ALIGN DOCUMENT IN FRAME');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isStable, setIsStable] = useState(false);

  // Background processing states
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');

  // State-driven coordinates for live border to prevent Reanimated SVG string crashes
  const [liveCorners, setLiveCorners] = useState<Point[]>([
    { x: 0.15, y: 0.25 },
    { x: 0.85, y: 0.25 },
    { x: 0.85, y: 0.75 },
    { x: 0.15, y: 0.75 },
  ]);

  const borderOpacity = useSharedValue(0.4);
  const captureButtonScale = useSharedValue(1);
  const laserPosition = useSharedValue(0);

  const cameraRef = useRef<CameraView>(null);
  const isDetectingRef = useRef(false);
  const lastCornersRef = useRef<Point[]>([]);
  const stableCountRef = useRef(0);

  // Handle imported gallery image route param
  useEffect(() => {
    if (importUri) {
      processCapturedImage(
        importUri,
        width ? Number(width) : 800,
        height ? Number(height) : 1000
      );
    }
  }, [importUri]);

  // Auto-trigger native scanner on mount if available
  useEffect(() => {
    if (isNativeScannerAvailable && viewState === 'camera') {
      // Delay slightly to prevent mounting glitches
      const t = setTimeout(() => {
        handleLaunchNativeScanner();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [viewState]);

  // Loop laser animation
  useEffect(() => {
    if (viewState !== 'camera') return;

    laserPosition.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200 }),
        withTiming(0, { duration: 2200 })
      ),
      -1,
      true
    );
  }, [viewState]);

  // Periodic border-search guide wiggle loop (simulates computer vision scanning)
  useEffect(() => {
    if (viewState !== 'camera' || autoCaptureEnabled || isNativeScannerAvailable) return;

    const wiggleInterval = setInterval(() => {
      const wiggle = () => (Math.random() - 0.5) * 0.015;
      setLiveCorners([
        { x: 0.15 + wiggle(), y: 0.25 + wiggle() },
        { x: 0.85 + wiggle(), y: 0.25 + wiggle() },
        { x: 0.85 + wiggle(), y: 0.75 + wiggle() },
        { x: 0.15 + wiggle(), y: 0.75 + wiggle() },
      ]);
    }, 900);

    return () => clearInterval(wiggleInterval);
  }, [viewState, autoCaptureEnabled]);

  // Background capture edge-detection snaps ONLY when auto-capture is toggled on
  useEffect(() => {
    let detectInterval: ReturnType<typeof setInterval> | null = null;

    if (viewState === 'camera' && permission?.granted && autoCaptureEnabled && !isNativeScannerAvailable) {
      setGuidancePrompt('SEARCHING FOR DOCUMENT...');
      borderOpacity.value = withSpring(0.7);

      detectInterval = setInterval(async () => {
        if (isDetectingRef.current || !cameraRef.current || viewState !== 'camera') return;
        isDetectingRef.current = true;

        try {
          const snapshot = await cameraRef.current.takePictureAsync({
            quality: 0.1,
          });

          if (snapshot && snapshot.uri) {
            const detectResult = await ImageProcessor.detectEdges(snapshot.uri);
            if (detectResult && detectResult.points && detectResult.points.length === 4) {
              const points = detectResult.points;
              const isFallback = points.every(p => p.x === 0.15 || p.x === 0.85);

              if (!isFallback) {
                runOnJS(setLiveCorners)(points);
                borderOpacity.value = withSpring(1.0);

                if (lastCornersRef.current.length === 4) {
                  let totalOffset = 0;
                  for (let i = 0; i < 4; i++) {
                    totalOffset += Math.hypot(
                      points[i].x - lastCornersRef.current[i].x,
                      points[i].y - lastCornersRef.current[i].y
                    );
                  }

                  if (totalOffset < 0.05) {
                    stableCountRef.current += 1;
                    if (stableCountRef.current >= 2) {
                      runOnJS(setIsStable)(true);
                      runOnJS(setGuidancePrompt)('HOLD STEADY...');
                      if (countdown === null) {
                        runOnJS(setCountdown)(2);
                      }
                    }
                  } else {
                    stableCountRef.current = 0;
                    runOnJS(setIsStable)(false);
                    runOnJS(setGuidancePrompt)('SEARCHING FOR DOCUMENT...');
                    if (countdown !== null) {
                      runOnJS(setCountdown)(null);
                    }
                  }
                }
                lastCornersRef.current = points;
              } else {
                resetLiveBorder();
              }
            } else {
              resetLiveBorder();
            }
          }
        } catch (e) {
          // No-op
        } finally {
          isDetectingRef.current = false;
        }
      }, 1200);
    } else {
      resetLiveBorder();
    }

    return () => {
      if (detectInterval) clearInterval(detectInterval);
    };
  }, [viewState, permission, autoCaptureEnabled, countdown]);

  // Gallery redirect import
  useEffect(() => {
    if (importUri) {
      setTimeout(() => {
        processCapturedImage(
          importUri,
          parseInt(width || '800', 10),
          parseInt(height || '1000', 10)
        );
      }, 300);
    }
  }, [importUri]);

  // Countdown timer handler
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      handleCapture();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
      setGuidancePrompt(`CAPTURING IN ${countdown - 1}...`);
    }, 800);

    return () => clearTimeout(timer);
  }, [countdown]);

  function resetLiveBorder() {
    setLiveCorners([
      { x: 0.15, y: 0.25 },
      { x: 0.85, y: 0.25 },
      { x: 0.85, y: 0.75 },
      { x: 0.15, y: 0.75 },
    ]);
    borderOpacity.value = withSpring(0.4);
    setIsStable(false);
    setGuidancePrompt(autoCaptureEnabled ? 'SEARCHING FOR DOCUMENT...' : 'ALIGN DOCUMENT IN FRAME');
  }

  // Compile points string for standard SVG
  const polyPointsString = liveCorners
    .map(p => `${p.x * viewfinderSize.width},${p.y * viewfinderSize.height}`)
    .join(' ');

  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: borderOpacity.value,
    };
  });

  const animatedLaserStyle = useAnimatedStyle(() => {
    const h = viewfinderSize.height;
    // Map laser bound to top and bottom points
    const minY = liveCorners[0].y * h;
    const maxY = liveCorners[3].y * h;
    const y = minY + laserPosition.value * (maxY - minY);
    return {
      transform: [{ translateY: y }],
      opacity: borderOpacity.value,
    };
  });

  const captureBtnStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: captureButtonScale.value }],
    };
  });

  // Launch Native Document Scanner (VNDocumentCameraViewController on iOS, ML Kit on Android)
  async function handleLaunchNativeScanner() {
    setProcessing(true);
    setProcessingMessage('Launching scanner...');
    try {
      const { scannedImages } = await DocumentScanner.scanDocument();

      if (scannedImages && scannedImages.length > 0) {
        setProcessingMessage('Processing scanned page...');

        // Native scanner returns already cropped and enhanced document image paths
        const pages: PageItemType[] = scannedImages.map((uri: any) => {
          const pageId = Math.random().toString(36).substring(2, 9);
          return {
            id: pageId,
            originalUri: uri,
            processedUri: uri,
            corners: [
              { x: 0, y: 0 },
              { x: 1, y: 0 },
              { x: 1, y: 1 },
              { x: 0, y: 1 }
            ],
            filter: 'original',
            rotation: 0,
          };
        });

        if (activeTab === 'single') {
          let docId = '';
          const newPage = pages[0];

          if (appendDocId) {
            const existingDoc = documents.find((d) => d.id === appendDocId);
            if (existingDoc) {
              const updatedPages = [...(existingDoc.pagesList || []), newPage];
              await updateDocument(appendDocId, {
                pages: updatedPages.length,
                pagesList: updatedPages,
              });
              docId = appendDocId;
            }
          } else {
            const newDoc = await addDocument({
              name: `Scan_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Math.floor(100 + Math.random() * 900)}.pdf`,
              size: 'Calculating...',
              pages: 1,
              pagesList: [newPage],
              thumbColor: '#E6F4F1',
            });
            docId = newDoc.id;
          }



          resetScanState();
          router.replace({
            pathname: '/documentEdit' as any,
            params: { id: docId },
          });
        } else {
          // Batch Mode
          setBatchPages((prev) => [...prev, ...pages]);
          if (pages.length > 0) {
            const firstNewIndex = batchPages.length;
            setBatchReviewIndex(firstNewIndex);
            setCurrentOriginalUri(pages[0].originalUri);
            setCurrentWarpedUri(pages[0].processedUri);
            setCurrentCorners(pages[0].corners);
            setCurrentFilter(pages[0].filter);
            setCurrentRotation(pages[0].rotation);
            setViewState('review');
          }
        }
      }
    } catch (e) {
      console.warn('Native Scanner error', e);
      Alert.alert('Scanner Error', 'Failed to launch native document scanner.');
    } finally {
      setProcessing(false);
    }
  };

  if (!permission && !isNativeScannerAvailable) {
    return (
      <View style={[styles.fallbackContainer, { backgroundColor: '#121212' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.fallbackText}>Initializing camera...</Text>
      </View>
    );
  }

  if (!permission?.granted && !isNativeScannerAvailable) {
    return (
      <View style={[styles.fallbackContainer, { backgroundColor: '#121212' }]}>
        <SafeAreaView style={styles.permissionCard} edges={['top', 'bottom']}>
          <View style={styles.permissionIconBox}>
            <Icon sf="camera.fill" fallback="📷" size={40} color={theme.primary} />
          </View>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionDescription}>
            DocScan Pro requires camera access to scan documents, crop background, and compile PDFs.
          </Text>
          <PrimaryButton
            label="Grant Permission"
            onPress={requestPermission}
            style={styles.permissionBtn}
          />
          <Pressable onPress={() => router.replace('/home' as any)} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Back to Dashboard</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  // Camera high-res capture handler (CamScanner model fallback)
  async function handleCapture() {
    if (processing || !cameraRef.current) return;
    setProcessing(true);
    setProcessingMessage('Capturing photo...');
    captureButtonScale.value = withSpring(0.85, { damping: 10 });

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });

      captureButtonScale.value = withSpring(1);

      if (photo && photo.uri) {
        setProcessingMessage('Aligning document...');

        // 1. Instant border detection on the captured photo
        const detectResult = await ImageProcessor.detectEdges(photo.uri);
        const points = (detectResult && detectResult.points && detectResult.points.length === 4)
          ? detectResult.points
          : [
            { x: 0.15, y: 0.15 },
            { x: 0.85, y: 0.15 },
            { x: 0.85, y: 0.85 },
            { x: 0.15, y: 0.85 }
          ];

        setCurrentOriginalUri(photo.uri);
        setImageWidth(photo.width);
        setImageHeight(photo.height);
        setCurrentCorners(points);

        // 2. Automatically crop, warp, and enhance the document immediately
        const warpedPath = await ImageProcessor.warpAndEnhance(
          photo.uri,
          points,
          currentFilter
        );

        setCurrentWarpedUri(warpedPath);

        // 3. Directly transition to the Review/Filter view
        setViewState('review');
      } else {
        throw new Error('Capture failed');
      }
    } catch (e: any) {
      console.warn('Capture failed:', e);
      Alert.alert('Camera Error', `Failed to capture image: ${e?.message || e}`);
    } finally {
      setProcessing(false);
    }
  }

  // Gallery import selector
  async function handleImportGallery() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setProcessing(true);
        setProcessingMessage('Aligning document...');
        processCapturedImage(asset.uri, asset.width || 800, asset.height || 1000);
      }
    } catch (e) {
      Alert.alert('Import Error', 'Failed to load image from photo library.');
    }
  }

  async function processCapturedImage(uri: string, width: number, height: number) {
    setBatchReviewIndex(batchPages.length);
    setCurrentOriginalUri(uri);
    setImageWidth(width);
    setImageHeight(height);
    setProcessing(true);
    setProcessingMessage('Aligning document...');

    try {
      const detectResult = await ImageProcessor.detectEdges(uri);
      const points = (detectResult && detectResult.points && detectResult.points.length === 4)
        ? detectResult.points
        : [
          { x: 0.15, y: 0.15 },
          { x: 0.85, y: 0.15 },
          { x: 0.85, y: 0.85 },
          { x: 0.15, y: 0.85 }
        ];
      setCurrentCorners(points);

      const warpedPath = await ImageProcessor.warpAndEnhance(
        uri,
        points,
        currentFilter
      );
      setCurrentWarpedUri(warpedPath);
      setViewState('review');
    } catch (err) {
      const fallbackPoints = [
        { x: 0.15, y: 0.15 },
        { x: 0.85, y: 0.15 },
        { x: 0.85, y: 0.85 },
        { x: 0.15, y: 0.85 }
      ];
      setCurrentCorners(fallbackPoints);
      try {
        const warpedPath = await ImageProcessor.warpAndEnhance(
          uri,
          fallbackPoints,
          currentFilter
        );
        setCurrentWarpedUri(warpedPath);
      } catch (e) {
        setCurrentWarpedUri(uri);
      }
      setViewState('review');
    } finally {
      setProcessing(false);
    }
  };

  // Warp Perspective save (triggered when manually editing cropping corners)
  const handleCropSave = async (selectedCorners: Point[]) => {
    if (!currentOriginalUri) return;
    setProcessing(true);
    setProcessingMessage('Enhancing document...');
    setCurrentCorners(selectedCorners);

    try {
      const warpedPath = await ImageProcessor.warpAndEnhance(
        currentOriginalUri,
        selectedCorners,
        currentFilter
      );
      setCurrentWarpedUri(warpedPath);
      setViewState('review');
    } catch (e: any) {
      Alert.alert('Enhance Error', e.message || 'Warp perspective transform failed.');
    } finally {
      setProcessing(false);
    }
  };

  // Filter application review
  const handleFilterChange = async (filterId: string) => {
    if (!currentOriginalUri || !currentCorners.length) return;
    setCurrentFilter(filterId);
    setProcessing(true);
    setProcessingMessage('Applying filter...');

    try {
      const warpedPath = await ImageProcessor.warpAndEnhance(
        currentOriginalUri,
        currentCorners,
        filterId
      );
      setCurrentWarpedUri(warpedPath);
    } catch (e) {
      Alert.alert('Filter Error', 'Failed to apply filter to image.');
    } finally {
      setProcessing(false);
    }
  };

  // Save single scanning result
  const handleSaveSingle = async () => {
    if (!currentWarpedUri || !currentOriginalUri) return;
    setProcessing(true);
    setProcessingMessage('Saving document...');

    try {
      const pageId = Math.random().toString(36).substring(2, 9);
      const newPage: PageItemType = {
        id: pageId,
        originalUri: currentOriginalUri,
        processedUri: currentWarpedUri,
        corners: currentCorners,
        filter: currentFilter,
        rotation: currentRotation,
      };

      let docId = '';
      if (appendDocId) {
        const existingDoc = documents.find((d) => d.id === appendDocId);
        if (existingDoc) {
          const updatedPages = [...(existingDoc.pagesList || []), newPage];
          await updateDocument(appendDocId, {
            pages: updatedPages.length,
            pagesList: updatedPages,
          });
          docId = appendDocId;
        }
      } else {
        const newDoc = await addDocument({
          name: `Scan_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Math.floor(100 + Math.random() * 900)}.pdf`,
          size: 'Calculating...',
          pages: 1,
          pagesList: [newPage],
          thumbColor: '#E6F4F1',
        });
        docId = newDoc.id;
      }



      resetScanState();
      router.push({
        pathname: '/documentEdit' as any,
        params: { id: docId },
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to save document.');
    } finally {
      setProcessing(false);
    }
  };

  // Add batch scan page
  const handleKeepBatchPage = () => {
    if (!currentWarpedUri || !currentOriginalUri) return;
    const pageId = Math.random().toString(36).substring(2, 9);
    const newPage: PageItemType = {
      id: pageId,
      originalUri: currentOriginalUri,
      processedUri: currentWarpedUri,
      corners: currentCorners,
      filter: currentFilter,
      rotation: currentRotation,
    };

    if (batchReviewIndex < batchPages.length) {
      const updated = [...batchPages];
      updated[batchReviewIndex] = newPage;
      setBatchPages(updated);
    } else {
      setBatchPages((prev) => [...prev, newPage]);
    }
    resetScanState();
  };

  const handleSelectBatchPage = (idx: number) => {
    const page = batchPages[idx];
    setBatchReviewIndex(idx);
    setCurrentOriginalUri(page.originalUri);
    setCurrentWarpedUri(page.processedUri);
    setCurrentCorners(page.corners);
    setCurrentFilter(page.filter);
    setCurrentRotation(page.rotation);
    setViewState('review');
  };

  const handleDeleteBatchPage = (idx: number) => {
    Alert.alert('Delete Page', 'Remove this page from the batch scan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = [...batchPages];
          updated.splice(idx, 1);
          setBatchPages(updated);

          if (updated.length === 0) {
            resetScanState();
          } else {
            const nextIdx = Math.max(0, idx - 1);
            handleSelectBatchPage(nextIdx);
          }
        },
      },
    ]);
  };

  const handleSaveAllBatch = async () => {
    if (batchPages.length === 0) return;
    setProcessing(true);
    setProcessingMessage('Assembling batch pages...');

    try {
      let docId = '';
      if (appendDocId) {
        const existingDoc = documents.find((d) => d.id === appendDocId);
        if (existingDoc) {
          const updatedPages = [...(existingDoc.pagesList || []), ...batchPages];
          await updateDocument(appendDocId, {
            pages: updatedPages.length,
            pagesList: updatedPages,
          });
          docId = appendDocId;
        }
      } else {
        const newDoc = await addDocument({
          name: `Batch_Scan_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`,
          size: 'Calculating...',
          pages: batchPages.length,
          pagesList: batchPages,
          thumbColor: '#EBEFF5',
        });
        docId = newDoc.id;
      }



      setBatchPages([]);
      resetScanState();

      router.push({
        pathname: '/documentEdit' as any,
        params: { id: docId },
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to save batch document.');
    } finally {
      setProcessing(false);
    }
  };

  function resetScanState() {
    setCurrentOriginalUri(null);
    setCurrentWarpedUri(null);
    setCurrentCorners([]);
    setCurrentFilter('magic');
    setCurrentRotation(0);
    setViewState('camera');
  }

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewfinderSize({ width, height });
  };

  // NATIVE SCANNER ACTIVE VIEW (Rendered if running in custom development client build)
  if (viewState === 'camera' && isNativeScannerAvailable) {
    return (
      <View style={[styles.root, { backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' }]}>
        <SafeAreaView style={styles.nativePromptCard}>
          <View style={[styles.nativePromptIconCircle, { backgroundColor: theme.primaryLight }]}>
            <Icon sf="camera.aperture" fallback="📷" size={32} color={theme.primary} />
          </View>
          <Text style={styles.nativePromptTitle}>Native Document Scanner</Text>
          <Text style={styles.nativePromptDesc}>
            Apple VisionKit / Google ML Kit scanner is active. Snapped images are automatically cropped, aligned, and optimized.
          </Text>
          <PrimaryButton
            label="Open Document Camera"
            onPress={handleLaunchNativeScanner}
            style={styles.nativePromptBtn}
          />
          <OutlineButton
            label="Back to Dashboard"
            onPress={() => router.replace('/home' as any)}
            style={styles.nativePromptBtn}
          />
        </SafeAreaView>

        {processing && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.loadingText}>{processingMessage}</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Camera viewport screen (Custom viewfinder fallback for Expo Go)
  if (viewState === 'camera') {
    return (
      <View style={styles.root}>
        {/* Real camera lens preview */}
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          mode="picture"
          enableTorch={flash === 'on'}
          zoom={zoom}
          ref={cameraRef}
        />

        {/* Live boundary guidelines layer */}
        <View style={styles.viewfinderBg} onLayout={handleLayout} pointerEvents="none">
          <Animated.View style={[styles.canvasOverlay, animatedOverlayStyle]}>
            <Polygon
              points={polyPointsString}
              fill={isStable ? 'rgba(239, 68, 68, 0.22)' : 'rgba(96, 165, 250, 0.15)'}
              stroke={isStable ? '#EF4444' : '#60A5FA'}
              strokeWidth="2.5"
            />
          </Animated.View>

          {/* Glowing laser scanning line */}
          <Animated.View
            style={[
              styles.laserLine,
              {
                backgroundColor: isStable ? '#EF4444' : '#60A5FA',
                shadowColor: isStable ? '#EF4444' : '#60A5FA',
              },
              animatedLaserStyle,
            ]}
          />

          {/* Countdown indicator */}
          {countdown !== null && (
            <View style={styles.countdownOverlay}>
              <Text style={[styles.countdownText, { color: theme.primary }]}>{countdown}</Text>
            </View>
          )}

          {/* Real-time status text badge */}
          <View style={styles.statusBadgeContainer}>
            <View style={[
              styles.statusBadge,
              {
                backgroundColor: 'rgba(18, 18, 18, 0.85)',
                borderColor: isStable ? '#EF4444' : 'rgba(255,255,255,0.15)',
              }
            ]}>
              <View style={[
                styles.statusBadgeDot,
                { backgroundColor: isStable ? '#EF4444' : '#FF9800' }
              ]} />
              <Text style={[styles.statusBadgeText, isStable && { color: '#EF4444' }]}>
                {guidancePrompt}
              </Text>
            </View>
          </View>
        </View>

        {/* Viewfinder Controls UI Overlay Container */}
        <View style={styles.overlayContainer} pointerEvents="box-none">
          {/* Top container containing statusbar spacing */}
          <View style={styles.topContainer} pointerEvents="box-none">
            <SafeAreaView edges={['top']} pointerEvents="none" style={{ height: 0 }} />

            {/* Top glassmorphic options bar */}
            <View style={[styles.topBar, Shadows.sm]}>
              <Pressable
                style={styles.iconBtn}
                onPress={() => router.replace('/home' as any)}
                accessibilityLabel="Back to dashboard"
              >
                <Icon sf="xmark" fallback="✕" size={18} color="#FFFFFF" />
              </Pressable>

              {/* Flash controls */}
              <Pressable
                style={[styles.iconBtn, flash === 'on' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
              >
                <Icon
                  sf={flash === 'on' ? 'bolt.fill' : 'bolt.slash.fill'}
                  fallback="⚡"
                  size={16}
                  color={flash === 'on' ? '#121212' : '#FFFFFF'}
                />
              </Pressable>

              {/* Grid toggle */}
              <Pressable
                style={[styles.iconBtn, showGrid && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setShowGrid(!showGrid)}
              >
                <Icon sf="grid" fallback="Grid" size={16} color={showGrid ? '#121212' : '#FFFFFF'} />
              </Pressable>

              {/* Zoom toggle */}
              <Pressable
                style={[styles.iconBtn, zoom > 0 && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setZoom((z) => (z === 0 ? 0.15 : 0))}
              >
                <Text style={[styles.zoomText, { color: zoom > 0 ? '#121212' : '#FFFFFF' }]}>
                  {zoom > 0 ? '2x' : '1x'}
                </Text>
              </Pressable>

              {/* Auto Capture toggle */}
              <Pressable
                style={[styles.iconBtn, autoCaptureEnabled && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setAutoCaptureEnabled(!autoCaptureEnabled)}
              >
                <Icon
                  sf={autoCaptureEnabled ? 'play.circle.fill' : 'hand.tap.fill'}
                  fallback="Auto"
                  size={16}
                  color={autoCaptureEnabled ? '#121212' : '#FFFFFF'}
                />
              </Pressable>

              {/* Capsule Switch Single/Batch */}
              <View style={styles.toggleContainer}>
                <Pressable
                  style={[styles.toggleBtn, activeTab === 'single' && styles.toggleBtnActive]}
                  onPress={() => {
                    setActiveTab('single');
                    setBatchPages([]);
                  }}
                >
                  <Text style={[styles.toggleText, activeTab === 'single' && styles.toggleTextActive]}>
                    Single
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleBtn, activeTab === 'batch' && styles.toggleBtnActive]}
                  onPress={() => setActiveTab('batch')}
                >
                  <Text style={[styles.toggleText, activeTab === 'batch' && styles.toggleTextActive]}>
                    Batch
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Grid visual guide */}
          {showGrid && (
            <View style={styles.gridGuideOverlay} pointerEvents="none">
              <View style={styles.gridLineV} />
              <View style={[styles.gridLineV, { left: '66.6%' }]} />
              <View style={styles.gridLineH} />
              <View style={[styles.gridLineH, { top: '66.6%' }]} />
            </View>
          )}

          {/* Shutter panel container pinned at the absolute bottom */}
          <View style={styles.bottomPanel} pointerEvents="box-none">
            <View style={styles.bottomControls}>
              {/* Photo Import Gallery */}
              <View style={styles.thumbWrapper}>
                <Pressable
                  style={styles.previewThumbContainer}
                  onPress={handleImportGallery}
                >
                  <View style={styles.previewThumbEmpty}>
                    <Icon sf="photo" fallback="🖼" size={20} color="rgba(255,255,255,0.75)" />
                  </View>
                </Pressable>
              </View>

              {/* Glowing camera aperture shutter button */}
              <AnimatedPressable
                onPress={handleCapture}
                style={[styles.captureBtnOuter, captureBtnStyle]}
              >
                <View style={styles.captureBtnInner} />
              </AnimatedPressable>

              {/* Batch previews count */}
              <View style={styles.thumbWrapper}>
                {activeTab === 'batch' && batchPages.length > 0 ? (
                  <Pressable
                    style={styles.previewThumbContainer}
                    onPress={() => handleSelectBatchPage(batchPages.length - 1)}
                  >
                    <Image
                      source={{ uri: batchPages[batchPages.length - 1].processedUri }}
                      style={styles.batchPreviewThumb}
                    />
                    <View style={[styles.countBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.countBadgeText}>{batchPages.length}</Text>
                    </View>
                  </Pressable>
                ) : (
                  <View style={styles.previewThumbEmptyPlaceholder} />
                )}
              </View>
            </View>

            {/* Document mode indicator selector */}
            <View style={styles.modePickerWrap}>
              <Text style={[styles.activeModeText, { color: theme.primary }]}>DOCUMENT SCANNER</Text>
            </View>

            <SafeAreaView edges={['bottom']} pointerEvents="none" style={{ height: 0 }} />
          </View>
        </View>

        {/* Global Loading overlay */}
        {processing && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.loadingText}>{processingMessage}</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  // 4-Point Draggable Cropping Mode (Adjust corners, exactly like CamScanner post-capture)
  if (viewState === 'cropping' && currentOriginalUri) {
    return (
      <DocumentCropView
        imageUri={currentOriginalUri}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        initialPoints={currentCorners}
        onCancel={resetScanState}
        onSave={handleCropSave}
      />
    );
  }

  // Enhancement Review Mode
  if (viewState === 'review' && currentWarpedUri) {
    return (
      <View style={[styles.root, { backgroundColor: '#121212' }]}>
        <SafeAreaView style={styles.reviewContainer} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.reviewHeader}>
            <Pressable style={styles.reviewHeaderBtn} onPress={() => setViewState('cropping')}>
              <Icon sf="crop" fallback="⛶" size={16} color={theme.primary} />
              <Text style={[styles.reviewHeaderBtnText, { color: theme.primary, marginLeft: 4 }]}>Adjust Corners</Text>
            </Pressable>
            <Text style={styles.reviewTitle}>
              {activeTab === 'single'
                ? 'Review Scan'
                : `Batch Item ${batchReviewIndex + 1} of ${batchPages.length}`}
            </Text>
            {activeTab === 'batch' ? (
              <Pressable
                style={styles.reviewHeaderBtn}
                onPress={() => handleDeleteBatchPage(batchReviewIndex)}
              >
                <Icon sf="trash" fallback="🗑" size={16} color="#FF6535" />
              </Pressable>
            ) : (
              <View style={{ width: 60 }} />
            )}
          </View>

          {/* Canvas sheet */}
          <View style={styles.previewCanvas}>
            <View style={[styles.documentSheetContainer, Shadows.md]}>
              <Image
                source={{ uri: currentWarpedUri }}
                style={[
                  styles.documentImage,
                  { transform: [{ rotate: `${currentRotation}deg` }] },
                ]}
                contentFit="contain"
              />
            </View>
          </View>

          {/* Rotate actions */}
          <View style={styles.reviewActions}>
            <Pressable
              style={styles.actionBadge}
              onPress={() => setCurrentRotation((r) => (r + 90) % 360)}
            >
              <Icon sf="rotate.right" fallback="↻" size={14} color="#FFFFFF" />
              <Text style={styles.actionBadgeText}>Rotate 90°</Text>
            </Pressable>
          </View>

          {/* Enhancement filter horizontal scroll */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>SELECT FILTER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {FILTER_OPTIONS.map((opt) => {
                const isSelected = opt.id === currentFilter;
                return (
                  <Pressable
                    key={opt.id}
                    style={[
                      styles.filterCard,
                      isSelected && { borderColor: theme.primary, backgroundColor: 'rgba(0,191,165,0.08)' },
                    ]}
                    onPress={() => handleFilterChange(opt.id)}
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

          {/* Save Bar */}
          <View style={styles.reviewFooterBar}>
            {activeTab === 'batch' ? (
              <View style={styles.batchPagerRow}>
                <Pressable
                  style={[styles.pagerBtn, batchReviewIndex === 0 && styles.pagerBtnDisabled]}
                  onPress={() => handleSelectBatchPage(batchReviewIndex - 1)}
                  disabled={batchReviewIndex === 0}
                >
                  <Icon sf="chevron.left" fallback="←" size={14} color="#FFFFFF" />
                  <Text style={styles.pagerBtnText}>Prev</Text>
                </Pressable>

                <Pressable
                  style={[styles.saveBtn, { backgroundColor: theme.primary, flex: 1.5 }]}
                  onPress={handleKeepBatchPage}
                >
                  <Text style={styles.saveBtnText}>Keep Page</Text>
                </Pressable>

                {batchPages.length > 0 && (
                  <Pressable
                    style={[styles.saveBtn, { backgroundColor: theme.orange, flex: 2 }]}
                    onPress={handleSaveAllBatch}
                  >
                    <Text style={styles.saveBtnText}>Save Batch ({batchPages.length})</Text>
                  </Pressable>
                )}

                <Pressable
                  style={[styles.pagerBtn, batchReviewIndex === batchPages.length - 1 && styles.pagerBtnDisabled]}
                  onPress={() => handleSelectBatchPage(batchReviewIndex + 1)}
                  disabled={batchReviewIndex === batchPages.length - 1}
                >
                  <Text style={styles.pagerBtnText}>Next</Text>
                  <Icon sf="chevron.right" fallback="→" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.singleSaveBar}>
                <OutlineButton
                  label="Retake"
                  onPress={resetScanState}
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  label="Save & Edit"
                  onPress={handleSaveSingle}
                  style={{ flex: 1.5 }}
                />
              </View>
            )}
          </View>
        </SafeAreaView>

        {/* Global Loading overlay */}
        {processing && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.loadingText}>{processingMessage}</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  fallbackText: {
    color: '#E0E0E0',
    marginTop: Spacing.sm,
    fontSize: Typography.sizes.sm,
  },
  permissionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    width: '100%',
    paddingHorizontal: Spacing.xl,
  },
  permissionIconBox: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: '#004D40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  permissionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: Typography.sizes.sm,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  permissionBtn: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cancelBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: Typography.sizes.sm,
  },
  viewfinderBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  canvasOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: Radius.full,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  statusBadgeContainer: {
    position: 'absolute',
    bottom: 230,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: Spacing.xs,
    borderWidth: 1,
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    zIndex: 4,
  },
  topContainer: {
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(18, 18, 18, 0.65)',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: Spacing.xs,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(30, 32, 31, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '800',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 32, 31, 0.8)',
    borderRadius: Radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  toggleTextActive: {
    color: '#121212',
    fontWeight: '800',
  },
  gridGuideOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    left: '33.3%',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: '33.3%',
  },
  bottomPanel: {
    width: '100%',
    backgroundColor: 'rgba(18, 18, 18, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingBottom: Spacing.sm,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  thumbWrapper: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewThumbContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'visible',
    position: 'relative',
  },
  previewThumbEmpty: {
    flex: 1,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewThumbEmptyPlaceholder: {
    width: 48,
    height: 48,
  },
  batchPreviewThumb: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
  },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: Radius.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 12,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  captureBtnOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modePickerWrap: {
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeModeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  /* Review screen layout */
  reviewContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  reviewHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  reviewHeaderBtnText: {
    fontSize: Typography.sizes.sm - 0.5,
    fontWeight: '700',
  },
  reviewTitle: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
  previewCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  documentSheetContainer: {
    width: SCREEN_W - 60,
    height: (SCREEN_W - 60) * 1.414,
    backgroundColor: '#000000',
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222222',
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  actionBadge: {
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
  actionBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterSection: {
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  filterSectionTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  filterCard: {
    width: 68,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: Radius.sm,
    padding: Spacing.xs,
    gap: 4,
  },
  filterPreview: {
    width: '100%',
    height: 28,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  filterCardText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  reviewFooterBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  singleSaveBar: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  saveBtn: {
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  batchPagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  pagerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  pagerBtnDisabled: {
    opacity: 0.3,
  },
  pagerBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Global Loading indicator */
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  loadingCard: {
    padding: Spacing.xl,
    backgroundColor: '#1E1E1E',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 99,
  },
  countdownText: {
    fontSize: 108,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },

  /* Native scanner prompt */
  nativePromptCard: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  nativePromptIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  nativePromptTitle: {
    fontSize: Typography.sizes.md + 2,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  nativePromptDesc: {
    fontSize: Typography.sizes.xs + 0.5,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  nativePromptBtn: {
    width: '85%',
    marginTop: Spacing.xs,
  },
});
