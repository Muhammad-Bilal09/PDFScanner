import AsyncStorage from '@react-native-async-storage/async-storage';
import { DocumentItemType } from '@/components/shared/DocumentCard';

const ONBOARDING_KEY = '@pdfscanner_onboarding';
const DOCUMENTS_KEY = '@pdfscanner_documents';
const SETTINGS_KEY = '@pdfscanner_settings';

export interface AppSettings {
  autoSync: boolean;
  wifiOnly: boolean;
  darkMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoSync: true,
  wifiOnly: true,
  darkMode: false,
};

// Initial sample documents
const SAMPLE_DOCUMENTS: DocumentItemType[] = [
  {
    id: '10',
    name: 'Q3_Financial_Statement_2023.pdf',
    date: 'Oct 12, 2023',
    size: '2.4 MB',
    pages: 0,
    thumbColor: '#E6F4F1',
    pagesList: [],
    tags: ['Business'],
    favorite: false,
  },
  {
    id: '11',
    name: 'Lunch_Receipt_Starbucks.jpg',
    date: 'Today, 1:45 PM',
    size: '850 KB',
    pages: 0,
    thumbColor: '#F2F2F2',
    pagesList: [],
    tags: ['Personal', 'Invoices'],
    favorite: true,
  },
  {
    id: '12',
    name: 'Office_Layout_Draft_v2.pdf',
    date: 'Oct 10, 2023',
    size: '5.1 MB',
    pages: 0,
    thumbColor: '#EBEFF5',
    pagesList: [],
    tags: ['Business'],
    favorite: false,
  },
];

export const LocalStorage = {
  // Onboarding
  async getOnboardingStatus(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(ONBOARDING_KEY);
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

  // Settings
  async getSettings(): Promise<AppSettings> {
    try {
      const val = await AsyncStorage.getItem(SETTINGS_KEY);
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

  // Documents
  async getDocuments(): Promise<DocumentItemType[]> {
    try {
      const val = await AsyncStorage.getItem(DOCUMENTS_KEY);
      if (!val) {
        // Seed initial mock docs
        await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(SAMPLE_DOCUMENTS));
        return SAMPLE_DOCUMENTS;
      }
      return JSON.parse(val);
    } catch {
      return SAMPLE_DOCUMENTS;
    }
  },

  async saveDocuments(docs: DocumentItemType[]): Promise<void> {
    try {
      await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
    } catch (e) {
      console.error('Error saving documents:', e);
    }
  },

  async addDocument(doc: Omit<DocumentItemType, 'id' | 'date'>): Promise<DocumentItemType> {
    const docs = await this.getDocuments();
    const newDoc: DocumentItemType = {
      ...doc,
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) + ', ' + new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      favorite: doc.favorite ?? false,
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
    const updated = docs.map((d) => (d.id === id ? { ...d, name: newName } : d));
    await this.saveDocuments(updated);
  },

  async updateDocument(id: string, updatedFields: Partial<DocumentItemType>): Promise<void> {
    const docs = await this.getDocuments();
    const updated = docs.map((d) => (d.id === id ? { ...d, ...updatedFields } : d));
    await this.saveDocuments(updated);
  },

  async toggleFavorite(id: string): Promise<boolean> {
    const docs = await this.getDocuments();
    let currentFavorite = false;
    const updated = docs.map((d) => {
      if (d.id === id) {
        currentFavorite = !d.favorite;
        return { ...d, favorite: currentFavorite };
      }
      return d;
    });
    await this.saveDocuments(updated);
    return currentFavorite;
  },
};
