import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LocalStorage } from '@/services/storage';
import { DocumentItemType } from '@/types/types';

interface DocumentContextType {
  documents: DocumentItemType[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addDocument: (doc: Partial<DocumentItemType>) => Promise<DocumentItemType>;
  deleteDocument: (id: string) => Promise<void>;
  renameDocument: (id: string, newName: string) => Promise<void>;
  updateDocument: (id: string, updatedFields: Partial<DocumentItemType>) => Promise<void>;
  toggleFavorite: (id: string) => Promise<boolean>;
}

const DocumentContext = createContext<DocumentContextType>({
  documents: [],
  loading: true,
  error: null,
  refresh: async () => {},
  addDocument: async () => ({} as DocumentItemType),
  deleteDocument: async () => {},
  renameDocument: async () => {},
  updateDocument: async () => {},
  toggleFavorite: async () => false,
});

export function DocumentProvider({ children }: { children: React.ReactNode }) {
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

  const addDocument = async (doc: Partial<DocumentItemType>) => {
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
        prev.map((d) => (d.id === id ? { ...d, name: newName, title: newName } : d))
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

  return (
    <DocumentContext.Provider
      value={{
        documents,
        loading,
        error,
        refresh: fetchDocuments,
        addDocument,
        deleteDocument,
        renameDocument,
        updateDocument,
        toggleFavorite,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocumentContext() {
  return useContext(DocumentContext);
}
