import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DocumentItemType } from '../types/types';

const ONBOARDING_KEY = '@scanly_onboarding';
const DOCUMENTS_KEY = '@scanly_documents';
const SETTINGS_KEY = '@scanly_settings';
const OLD_ONBOARDING_KEY = '@pdfscanner_onboarding';
const OLD_DOCUMENTS_KEY = '@pdfscanner_documents';
const OLD_SETTINGS_KEY = '@pdfscanner_settings';

const DEFAULT_SETTINGS: AppSettings = {
  autoCrop: true,
  defaultFilter: 'magic',
  pdfQuality: 'high',
  saveToGallery: false,
  cloudSyncEnabled: true,
  darkTheme: false,
  ocrLanguage: 'en',
  watermarkText: 'Scanly',
};

const SAMPLE_DOCUMENTS: DocumentItemType[] = [];

export const LocalStorage = {
  async getOnboardingStatus(): Promise<boolean> {
    try {
      let val = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (val === null) {
        val = await AsyncStorage.getItem(OLD_ONBOARDING_KEY);
      }
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setOnboardingStatus(viewed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, viewed ? 'true' : 'false');
    } catch (e) {
      console.error('Error saving onboarding status:', e);
    }
  },

  async getSettings(): Promise<AppSettings> {
    try {
      let val = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!val) {
        val = await AsyncStorage.getItem(OLD_SETTINGS_KEY);
      }
      return val ? JSON.parse(val) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  },

  async getDocuments(): Promise<DocumentItemType[]> {
    try {
      let val = await AsyncStorage.getItem(DOCUMENTS_KEY);
      if (!val) {
        val = await AsyncStorage.getItem(OLD_DOCUMENTS_KEY);
      }
      if (!val) {
        return [];
      }
      const parsed = JSON.parse(val) as DocumentItemType[];
      const cleaned = parsed.filter(doc => doc.id !== '10' && doc.id !== '11' && doc.id !== '12');
      if (cleaned.length !== parsed.length) {
        await this.saveDocuments(cleaned);
      }
      return cleaned;
    } catch {
      return [];
    }
  },

  async saveDocuments(docs: DocumentItemType[]): Promise<void> {
    try {
      await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
    } catch (e) {
      console.error('Error saving documents:', e);
    }
  },

  async addDocument(doc: any): Promise<DocumentItemType> {
    const docs = await this.getDocuments();
    const now = Date.now();
    const newDoc: DocumentItemType = {
      ...doc,
      id: doc.id || `doc_${now}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: doc.createdAt || now,
      updatedAt: doc.updatedAt || now,
      tags: doc.tags ?? [],
    };
    docs.unshift(newDoc);
    await this.saveDocuments(docs);
    return newDoc;
  },

  async deleteDocument(id: string): Promise<void> {
    const docs = await this.getDocuments();
    const filtered = docs.filter((d) => d.id !== id);
    await this.saveDocuments(filtered);
  },

  async renameDocument(id: string, newName: string): Promise<void> {
    const docs = await this.getDocuments();
    const updated = docs.map((d) => (d.id === id ? { ...d, title: newName, updatedAt: Date.now() } : d));
    await this.saveDocuments(updated);
  },

  async updateDocument(id: string, updatedFields: Partial<DocumentItemType>): Promise<void> {
    const docs = await this.getDocuments();
    const updated = docs.map((d) => (d.id === id ? { ...d, ...updatedFields, updatedAt: Date.now() } : d));
    await this.saveDocuments(updated);
  },

  async toggleFavorite(id: string): Promise<boolean> {
    const docs = await this.getDocuments();
    let currentFav = false;
    const updated = docs.map((d) => {
      if (d.id === id) {
        currentFav = !d.favorite;
        return { ...d, favorite: currentFav, updatedAt: Date.now() };
      }
      return d;
    });
    await this.saveDocuments(updated);
    return currentFav;
  },
};
