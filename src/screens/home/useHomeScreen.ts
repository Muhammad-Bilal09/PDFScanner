import React, { useEffect, useState } from 'react';
import { showAlert } from '@/utils/alert';
import { useRouter } from 'expo-router';
import { pickPhotoWithPermissions } from '@/utils/photoPicker';
import { useDocuments } from '@/hooks/useDocuments';
import { useTheme } from '@/hooks/useTheme';
import { DocumentItemType } from '@/types/types';

export function useHomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  const {
    documents,
    deleteDocument,
    renameDocument,
    toggleFavorite,
    refresh,
  } = useDocuments();

  const [selectedDoc, setSelectedDoc] = useState<DocumentItemType | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameText, setRenameText] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  const storageStats = React.useMemo(() => {
    let totalSizeB = 0;
    let favoritesCount = 0;

    documents.forEach((doc: any) => {
      if (doc.favorite) favoritesCount++;
      const sizeStr = doc.size || doc.pdfSizeFormatted || '0 KB';
      const val = parseFloat(sizeStr);
      if (sizeStr.includes('MB')) {
        totalSizeB += val * 1024 * 1024;
      } else if (sizeStr.includes('KB')) {
        totalSizeB += val * 1024;
      } else {
        totalSizeB += val;
      }
    });

    const localMb = (totalSizeB / (1024 * 1024)).toFixed(1);
    return {
      localSize: `${localMb} MB`,
      favoritesCount,
      totalCount: documents.length,
    };
  }, [documents]);

  const handleDocumentPress = (id: string) => {
    router.push({ pathname: '/documentEdit' as any, params: { id } });
  };

  const handleMenuPress = (doc: any) => {
    setSelectedDoc(doc);
    setRenameText(doc.name || doc.title || '');
    setShowMenu(true);
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    const docTitle = selectedDoc.title || (selectedDoc as any).name || 'Document';
    showAlert(
      'Delete Document',
      `Are you sure you want to delete ${docTitle}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(selectedDoc.id);
              setShowMenu(false);
            } catch (e) {
              showAlert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const handleRenameSave = async () => {
    if (!selectedDoc || !renameText.trim()) return;
    try {
      await renameDocument(selectedDoc.id, renameText.trim());
      setShowRenameModal(false);
      setShowMenu(false);
    } catch (e) {
      showAlert('Error', 'Failed to rename document');
    }
  };

  const handleToggleFavorite = async () => {
    if (!selectedDoc) return;
    try {
      await toggleFavorite(selectedDoc.id);
      setShowMenu(false);
      showAlert(
        'Success',
        (selectedDoc as any).favorite ? 'Removed from favorites' : 'Added to favorites'
      );
    } catch (e) {
      showAlert('Error', 'Failed to update favorite status');
    }
  };

  const handleImportGallery = async () => {
    const picked = await pickPhotoWithPermissions();
    if (picked) {
      router.push({
        pathname: '/scan' as any,
        params: {
          importUri: picked.uri,
          width: picked.width,
          height: picked.height,
        },
      });
    }
  };

  const sortedDocs = React.useMemo(() => {
    return [...documents].sort((a: any, b: any) => {
      const timeA = a.createdAt || (a.id.startsWith('doc_') ? parseInt(a.id.split('_')[1], 10) || 0 : 0);
      const timeB = b.createdAt || (b.id.startsWith('doc_') ? parseInt(b.id.split('_')[1], 10) || 0 : 0);
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return documents.indexOf(a) - documents.indexOf(b);
    });
  }, [documents]);

  return {
    router,
    theme,
    storageStats,
    sortedDocs,
    selectedDoc,
    showMenu,
    setShowMenu,
    showRenameModal,
    setShowRenameModal,
    renameText,
    setRenameText,
    handleDocumentPress,
    handleMenuPress,
    handleDelete,
    handleRenameSave,
    handleToggleFavorite,
    handleImportGallery,
  };
}
