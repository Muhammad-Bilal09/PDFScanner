import { useEffect, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import { showAlert } from '@/utils/alert';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import {
  optimizeImageForScanning,
  pickMultiplePhotosWithPermissions,
  pickPhotoWithPermissions,
} from '@/utils/photoPicker';
import { useDocuments } from '@/hooks/useDocuments';
import { useTheme } from '@/hooks/useTheme';
import { ImageProcessor } from '@/services/processor';
import { FilterType, PageItemType, Point } from '@/types/types';

let DocumentScanner: any = null;
try {
  DocumentScanner = require('react-native-document-scanner-plugin').default;
} catch (e) {
  // Native module optional fallback
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export function useScanScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { importUri, width, height, appendDocId } = useLocalSearchParams<{
    importUri?: string;
    width?: string;
    height?: string;
    appendDocId?: string;
  }>();

  const { addDocument, updateDocument, documents } = useDocuments();
  const scannerOpenedRef = useRef<boolean>(false);

  const [scanMode, setScanMode] = useState<'single' | 'batch'>('single');
  const [viewState, setViewState] = useState<'camera' | 'review'>('camera');
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');

  const [currentOriginalUri, setCurrentOriginalUri] = useState<string | null>(null);
  const [currentWarpedUri, setCurrentWarpedUri] = useState<string | null>(null);
  const [currentCorners, setCurrentCorners] = useState<Point[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('original');
  const [currentRotation, setCurrentRotation] = useState<number>(0);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({
    width: SCREEN_W,
    height: SCREEN_H,
  });

  const [batchPages, setBatchPages] = useState<PageItemType[]>([]);
  const [batchReviewIndex, setBatchReviewIndex] = useState<number>(0);

  const launchDocumentScanner = async (): Promise<boolean> => {
    if (!DocumentScanner) return false;

    try {
      setProcessing(true);
      setProcessingMessage('Opening Document Scanner...');

      const { scannedImages } = await DocumentScanner.scanDocument({
        croppedImageQuality: 90,
      });

      if (scannedImages && scannedImages.length > 0) {
        setProcessingMessage('Processing scanned pages...');

        const pages: PageItemType[] = [];
        for (const rawUri of scannedImages) {
          const pageId = Math.random().toString(36).substring(2, 9);
          const localPhoto = await optimizeImageForScanning(rawUri);
          pages.push({
            id: pageId,
            originalUri: localPhoto.uri,
            croppedUri: localPhoto.uri,
            processedUri: localPhoto.uri,
            thumbnailUri: localPhoto.uri,
            corners: [
              { x: 0, y: 0 },
              { x: 1, y: 0 },
              { x: 1, y: 1 },
              { x: 0, y: 1 },
            ],
            filter: 'original',
            rotation: 0,
          });
        }

        if (pages.length > 0) {
          let docId = '';
          if (appendDocId) {
            const existingDoc = documents.find((d) => d.id === appendDocId);
            if (existingDoc) {
              const updatedPages = [...(existingDoc.pagesList || []), ...pages];
              await updateDocument(appendDocId, {
                pages: updatedPages.length,
                pagesList: updatedPages,
              });
              docId = appendDocId;
            }
          } else {
            const docName = `Scanly_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Math.floor(100 + Math.random() * 900)}.pdf`;
            const newDoc = await addDocument({
              title: docName,
              name: docName,
              size: 'Calculating...',
              pages: pages.length,
              pagesList: pages,
              thumbColor: '#E6F4F1',
            });
            docId = newDoc.id;
          }

          router.replace({
            pathname: '/documentEdit' as any,
            params: { id: docId },
          });
          return true;
        }
      }
    } catch (err: any) {
      console.warn('[Scan] DocumentScanner error:', err);
    } finally {
      setProcessing(false);
    }
    return false;
  };

  useEffect(() => {
    if (importUri) {
      const w = width ? parseInt(width, 10) : 1920;
      const h = height ? parseInt(height, 10) : 1920;
      processCapturedImage(importUri, w, h);
    } else if (!scannerOpenedRef.current) {
      scannerOpenedRef.current = true;
      launchDocumentScanner();
    }
  }, [importUri]);

  const processCapturedImage = async (uri: string, rawWidth: number, rawHeight: number) => {
    setProcessing(true);
    setProcessingMessage('Detecting page borders...');

    try {
      const localPhoto = await optimizeImageForScanning(uri);
      setImageSize({ width: localPhoto.width, height: localPhoto.height });
      setCurrentOriginalUri(localPhoto.uri);

      const detectResult = await ImageProcessor.detectEdges(localPhoto.uri);
      let initialPoints: Point[] = [
        { x: 0.15, y: 0.15 },
        { x: 0.85, y: 0.15 },
        { x: 0.85, y: 0.85 },
        { x: 0.15, y: 0.85 },
      ];

      if (detectResult && detectResult.points && detectResult.points.length === 4) {
        initialPoints = detectResult.points;
      }
      setCurrentCorners(initialPoints);

      setProcessingMessage('Enhancing page...');
      const warpedPath = await ImageProcessor.warpAndEnhance(
        localPhoto.uri,
        initialPoints,
        currentFilter
      );

      setCurrentWarpedUri(warpedPath);
      setCurrentRotation(0);
      setViewState('review');
    } catch (err) {
      showAlert('Processing Failed', 'Unable to process document. Using original image.');
      setCurrentOriginalUri(uri);
      setCurrentWarpedUri(uri);
      setCurrentCorners([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ]);
      setViewState('review');
    } finally {
      setProcessing(false);
    }
  };

  const handleCapture = async () => {
    await launchDocumentScanner();
  };

  const handlePickFromGallery = async () => {
    if (scanMode === 'single') {
      const picked = await pickPhotoWithPermissions();
      if (picked) {
        await processCapturedImage(picked.uri, picked.width, picked.height);
      }
    } else {
      const pickedList = await pickMultiplePhotosWithPermissions();
      if (!pickedList || pickedList.length === 0) return;

      setProcessing(true);
      setProcessingMessage(`Importing ${pickedList.length} photos...`);

      try {
        if (pickedList.length === 1) {
          const item = pickedList[0];
          await processCapturedImage(item.uri, item.width || 1920, item.height || 1920);
        } else {
          const importedPages: PageItemType[] = [];
          for (const item of pickedList) {
            const detectResult = await ImageProcessor.detectEdges(item.uri);
            const points =
              detectResult && detectResult.points && detectResult.points.length === 4
                ? detectResult.points
                : [
                    { x: 0.15, y: 0.15 },
                    { x: 0.85, y: 0.15 },
                    { x: 0.85, y: 0.85 },
                    { x: 0.15, y: 0.85 },
                  ];

            const warpedPath = await ImageProcessor.warpAndEnhance(
              item.uri,
              points,
              currentFilter
            );

            importedPages.push({
              id: Math.random().toString(36).substring(2, 9),
              originalUri: item.uri,
              croppedUri: warpedPath,
              processedUri: warpedPath,
              thumbnailUri: warpedPath,
              corners: points,
              filter: currentFilter,
              rotation: 0,
            });
          }

          setBatchPages((prev) => [...prev, ...importedPages]);
          if (importedPages.length > 0) {
            const firstIdx = batchPages.length;
            setBatchReviewIndex(firstIdx);
            setCurrentOriginalUri(importedPages[0].originalUri);
            setCurrentWarpedUri(
              importedPages[0].processedUri || importedPages[0].croppedUri || ''
            );
            setCurrentCorners(importedPages[0].corners || []);
            setCurrentFilter((importedPages[0].filter || 'original') as FilterType);
            setCurrentRotation(importedPages[0].rotation || 0);
            setViewState('review');
          }
        }
      } catch (err) {
        showAlert('Import Error', 'Failed to process imported images.');
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleApplyFilter = async (filter: FilterType) => {
    if (!currentOriginalUri) return;
    setCurrentFilter(filter);
    setProcessing(true);
    setProcessingMessage('Applying filter...');

    try {
      const warpedPath = await ImageProcessor.warpAndEnhance(
        currentOriginalUri,
        currentCorners,
        filter
      );
      setCurrentWarpedUri(warpedPath);
    } catch (err) {
      console.warn('Filter Error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRotate = () => {
    setCurrentRotation((prev) => (prev + 90) % 360);
  };

  const handleSaveSingleScan = async () => {
    if (!currentWarpedUri || !currentOriginalUri) return;

    setProcessing(true);
    setProcessingMessage('Saving document...');

    try {
      let finalWarpedUri = currentWarpedUri;
      if (currentRotation !== 0) {
        try {
          const rotated = await manipulateAsync(
            currentWarpedUri,
            [{ rotate: currentRotation }],
            { format: SaveFormat.JPEG, compress: 0.9 }
          );
          finalWarpedUri = rotated.uri;
        } catch (e) {
          console.warn('Failed to bake rotation into image:', e);
        }
      }

      const pageId = Math.random().toString(36).substring(2, 9);
      const newPage: PageItemType = {
        id: pageId,
        originalUri: currentOriginalUri,
        croppedUri: finalWarpedUri,
        processedUri: finalWarpedUri,
        thumbnailUri: finalWarpedUri,
        corners: currentCorners,
        filter: currentFilter,
        rotation: 0,
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
        const docName = `Scanly_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Math.floor(100 + Math.random() * 900)}.pdf`;
        const newDoc = await addDocument({
          title: docName,
          name: docName,
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
    } catch (e) {
      showAlert('Error', 'Failed to save document.');
    } finally {
      setProcessing(false);
    }
  };

  const handleKeepBatchPage = () => {
    if (!currentWarpedUri || !currentOriginalUri) return;
    const pageId = Math.random().toString(36).substring(2, 9);
    const newPage: PageItemType = {
      id: pageId,
      originalUri: currentOriginalUri,
      croppedUri: currentWarpedUri,
      processedUri: currentWarpedUri,
      thumbnailUri: currentWarpedUri,
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
    if (!page) return;
    setBatchReviewIndex(idx);
    setCurrentOriginalUri(page.originalUri);
    setCurrentWarpedUri(page.processedUri || page.croppedUri || '');
    setCurrentCorners(page.corners || []);
    setCurrentFilter((page.filter || 'original') as FilterType);
    setCurrentRotation(page.rotation || 0);
    setViewState('review');
  };

  const handleDeleteBatchPage = (idx: number) => {
    showAlert('Delete Page', 'Remove this page from the batch scan?', [
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
        const batchName = `Scanly_Batch_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`;
        const newDoc = await addDocument({
          title: batchName,
          name: batchName,
          size: 'Calculating...',
          pages: batchPages.length,
          pagesList: batchPages,
          thumbColor: '#EBEFF5',
        });
        docId = newDoc.id;
      }

      setBatchPages([]);
      resetScanState();

      router.replace({
        pathname: '/documentEdit' as any,
        params: { id: docId },
      });
    } catch (e) {
      showAlert('Error', 'Failed to save batch document.');
    } finally {
      setProcessing(false);
    }
  };

  const resetScanState = () => {
    setCurrentOriginalUri(null);
    setCurrentWarpedUri(null);
    setCurrentCorners([]);
    setCurrentFilter('original');
    setCurrentRotation(0);
    setViewState('camera');
  };

  return {
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
    launchDocumentScanner,
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
  };
}
