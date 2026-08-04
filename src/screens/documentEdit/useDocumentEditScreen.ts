import { useState, useMemo } from 'react';
import { showAlert } from '@/utils/alert';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { pickMultiplePhotosWithPermissions } from '@/utils/photoPicker';
import { useDocuments } from '@/hooks/useDocuments';
import { useTheme } from '@/hooks/useTheme';
import { ImageProcessor } from '@/services/processor';
import { DocumentItemType, FilterType, PageItemType, Point } from '@/types/types';

export function useDocumentEditScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { documents, updateDocument, refresh } = useDocuments();

  const document = useMemo(() => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return null;
    return {
      ...doc,
      pagesList: doc.pagesList || [],
    };
  }, [id, documents]);

  const [activePage, setActivePage] = useState<PageItemType | null>(null);
  const [previewPage, setPreviewPage] = useState<PageItemType | null>(null);
  const [editMode, setEditMode] = useState<'crop' | 'filter' | 'adjust' | null>(null);

  const [cropPoints, setCropPoints] = useState<Point[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType | string>('magic');
  const [activeRotation, setActiveRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);

  const [processing, setProcessing] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameText, setRenameText] = useState('');

  const handleStartReedit = (page: PageItemType) => {
    setPreviewPage(null);
    setActivePage(page);
    setCropPoints(
      page.corners && page.corners.length === 4
        ? page.corners
        : [
            { x: 0.05, y: 0.05 },
            { x: 0.95, y: 0.05 },
            { x: 0.95, y: 0.95 },
            { x: 0.05, y: 0.95 },
          ]
    );
    setActiveFilter(page.filter || 'magic');
    setActiveRotation(page.rotation || 0);
    setBrightness(page.brightness || 0);
    setContrast(page.contrast || 0);
    setEditMode('crop');
  };

  const handleDeletePage = (pageId: string) => {
    if (!document || !document.pagesList) return;
    if (document.pagesList.length <= 1) {
      showAlert('Cannot Delete', 'A scanned document must contain at least one page.');
      return;
    }

    showAlert('Delete Page', 'Are you sure you want to remove this page?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!document.pagesList) return;
          const updatedPages = document.pagesList.filter((p) => p.id !== pageId);
          await updateDocument(document.id, {
            pages: updatedPages.length,
            pagesList: updatedPages,
          });
        },
      },
    ]);
  };

  const handleRotatePage = async (pageId: string) => {
    if (!document || !document.pagesList) return;
    const targetPage = document.pagesList.find((p) => p.id === pageId);
    if (!targetPage) return;

    setProcessing(true);
    try {
      const rotated = await manipulateAsync(
        targetPage.processedUri || targetPage.croppedUri || targetPage.originalUri,
        [{ rotate: 90 }],
        { format: SaveFormat.JPEG, compress: 0.9 }
      );

      const updatedPages = document.pagesList.map((p) =>
        p.id === pageId
          ? {
              ...p,
              processedUri: rotated.uri,
              rotation: 0,
            }
          : p
      );

      await updateDocument(document.id, { pagesList: updatedPages });
    } catch (err) {
      showAlert('Rotation Failed', 'Could not rotate page.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDuplicatePage = async (page: PageItemType) => {
    if (!document || !document.pagesList) return;
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

  const handleMoveUp = async (idx: number) => {
    if (!document || !document.pagesList || idx === 0) return;
    const updatedPages = [...document.pagesList];
    const temp = updatedPages[idx];
    updatedPages[idx] = updatedPages[idx - 1];
    updatedPages[idx - 1] = temp;
    await updateDocument(document.id, { pagesList: updatedPages });
  };

  const handleMoveDown = async (idx: number) => {
    if (!document || !document.pagesList || idx === document.pagesList.length - 1) return;
    const updatedPages = [...document.pagesList];
    const temp = updatedPages[idx];
    updatedPages[idx] = updatedPages[idx + 1];
    updatedPages[idx + 1] = temp;
    await updateDocument(document.id, { pagesList: updatedPages });
  };

  const handleAddPages = async () => {
    if (!document) return;
    const pickedList = await pickMultiplePhotosWithPermissions();
    if (!pickedList || pickedList.length === 0) return;

    setProcessing(true);
    try {
      const newPages: PageItemType[] = [];
      for (const item of pickedList) {
        const detectResult = await ImageProcessor.detectEdges(item.uri);
        const points =
          detectResult && detectResult.points && detectResult.points.length === 4
            ? detectResult.points
            : [
                { x: 0.05, y: 0.05 },
                { x: 0.95, y: 0.05 },
                { x: 0.95, y: 0.95 },
                { x: 0.05, y: 0.95 },
              ];

        const warpedPath = await ImageProcessor.warpAndEnhance(item.uri, points, 'magic');

        newPages.push({
          id: Math.random().toString(36).substring(2, 9),
          originalUri: item.uri,
          croppedUri: warpedPath,
          processedUri: warpedPath,
          thumbnailUri: warpedPath,
          corners: points,
          filter: 'magic',
          rotation: 0,
        });
      }

      const currentPages = document.pagesList || [];
      const updatedPages = [...currentPages, ...newPages];
      await updateDocument(document.id, {
        pages: updatedPages.length,
        pagesList: updatedPages,
      });
    } catch (err) {
      showAlert('Import Error', 'Failed to import additional pages.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveReedit = async () => {
    if (!document || !activePage || !document.pagesList) return;
    setProcessing(true);
    try {
      let finalProcessedUri = await ImageProcessor.warpAndEnhance(
        activePage.originalUri,
        cropPoints,
        activeFilter as FilterType
      );

      if (activeRotation !== 0) {
        const rotated = await manipulateAsync(
          finalProcessedUri,
          [{ rotate: activeRotation }],
          { format: SaveFormat.JPEG, compress: 0.9 }
        );
        finalProcessedUri = rotated.uri;
      }

      const updatedPages = document.pagesList.map((p) =>
        p.id === activePage.id
          ? {
              ...p,
              processedUri: finalProcessedUri,
              corners: cropPoints,
              filter: activeFilter,
              rotation: 0,
            }
          : p
      );

      await updateDocument(document.id, { pagesList: updatedPages });
      setActivePage(null);
      setEditMode(null);
    } catch (err) {
      showAlert('Error', 'Failed to save page edits.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveRename = async () => {
    if (!document || !renameText.trim()) return;
    await updateDocument(document.id, { title: renameText.trim(), name: renameText.trim() });
    setShowRenameModal(false);
  };

  return {
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
  };
}
