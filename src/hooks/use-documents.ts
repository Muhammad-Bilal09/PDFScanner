import { useState, useEffect, useCallback } from 'react';
import { LocalStorage } from '@/services/storage';
import { DocumentItemType } from '@/components/shared/DocumentCard';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentItemType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await LocalStorage.getDocuments();
      setDocuments(docs);
    } catch (e) {
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, []);

  const addDocument = async (doc: Omit<DocumentItemType, 'id' | 'date'>) => {
    try {
      const newDoc = await LocalStorage.addDocument(doc);
      setDocuments((prev) => [newDoc, ...prev]);
      return newDoc;
    } catch (e) {
      setError('Failed to add document');
      throw e;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await LocalStorage.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError('Failed to delete document');
      throw e;
    }
  };

  const renameDocument = async (id: string, newName: string) => {
    try {
      await LocalStorage.renameDocument(id, newName);
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name: newName } : d))
      );
    } catch (e) {
      setError('Failed to rename document');
      throw e;
    }
  };

  const updateDocument = async (id: string, updatedFields: Partial<DocumentItemType>) => {
    try {
      await LocalStorage.updateDocument(id, updatedFields);
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updatedFields } : d))
      );
    } catch (e) {
      setError('Failed to update document');
      throw e;
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const fav = await LocalStorage.toggleFavorite(id);
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, favorite: fav } : d))
      );
      return fav;
    } catch (e) {
      setError('Failed to toggle favorite');
      throw e;
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    refresh: fetchDocuments,
    addDocument,
    deleteDocument,
    renameDocument,
    updateDocument,
    toggleFavorite,
  };
}
