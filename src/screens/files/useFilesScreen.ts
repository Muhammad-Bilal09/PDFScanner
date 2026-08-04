import React, { useEffect, useState } from 'react';
import { showAlert } from '@/utils/alert';
import { useRouter } from 'expo-router';
import { useDocuments } from '@/hooks/useDocuments';
import { useTheme } from '@/hooks/useTheme';
import { DocumentFilter, DocumentItemType } from '@/types/types';

export function useFilesScreen() {
  const router = useRouter();
  const theme = useTheme();

  const {
    documents,
    deleteDocument,
    renameDocument,
    toggleFavorite,
    refresh,
  } = useDocuments();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<DocumentFilter>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [selectedDoc, setSelectedDoc] = useState<DocumentItemType | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameText, setRenameText] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  const filteredDocuments = React.useMemo(() => {
    return documents.filter((doc: any) => {
      const docName = doc.name || doc.title || '';
      const matchesSearch =
        docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.tags && doc.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;

      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'scans') return doc.category === 'scans' || !doc.category;
      if (selectedFilter === 'documents') return doc.category === 'documents';
      if (selectedFilter === 'receipts') return doc.category === 'receipts';
      if (selectedFilter === 'cards') return doc.category === 'cards';

      return true;
    });
  }, [documents, searchQuery, selectedFilter]);

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

  return {
    router,
    theme,
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    viewMode,
    setViewMode,
    filteredDocuments,
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
  };
}
