import AsyncStorage from '@react-native-async-storage/async-storage';
import { CloudinaryService } from './cloudinary';
import { LocalStorage } from './storage';

const SYNC_QUEUE_KEY = '@pdfscanner_sync_queue';

export interface SyncQueueItem {
  id: string;
  docId: string;
  pageId?: string; // If it's a page image
  fileUri: string;
  type: 'original' | 'processed' | 'pdf';
  retryCount: number;
  status: 'pending' | 'uploading' | 'failed';
}

// Check internet connectivity via a lightweight HTTP ping
async function isOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1500);
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(id);
    return response.ok;
  } catch {
    return false;
  }
}

export const CloudSyncManager = {
  /**
   * Fetch all items in the sync queue.
   */
  async getQueue(): Promise<SyncQueueItem[]> {
    try {
      const val = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  },

  /**
   * Save the sync queue state.
   */
  async saveQueue(queue: SyncQueueItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('[SyncManager] Error saving sync queue:', e);
    }
  },

  /**
   * Add a file to the offline sync queue.
   */
  async addToQueue(params: {
    docId: string;
    pageId?: string;
    fileUri: string;
    type: 'original' | 'processed' | 'pdf';
  }): Promise<void> {
    const queue = await this.getQueue();
    
    // Check if item is already in queue
    const exists = queue.some((item) => item.fileUri === params.fileUri);
    if (exists) return;

    const newItem: SyncQueueItem = {
      id: Math.random().toString(36).substring(2, 9),
      docId: params.docId,
      pageId: params.pageId,
      fileUri: params.fileUri,
      type: params.type,
      retryCount: 0,
      status: 'pending',
    };

    queue.push(newItem);
    await this.saveQueue(queue);
    console.log(`[SyncManager] Added item to sync queue: ${params.type} file`);
    
    // Trigger sync run in the background
    this.processQueue();
  },

  /**
   * Process and upload queued files if online.
   */
  async processQueue(): Promise<void> {
    const online = await isOnline();
    if (!online) {
      console.log('[SyncManager] Device is offline. Sync queue processing deferred.');
      return;
    }

    const queue = await this.getQueue();
    if (queue.length === 0) return;

    console.log(`[SyncManager] Running queue processing. Items: ${queue.length}`);

    // Update statuses to run
    const updatedQueue = [...queue];

    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i];
      if (item.status === 'uploading') continue; // Skip active jobs

      try {
        item.status = 'uploading';
        await this.saveQueue(updatedQueue);

        console.log(`[SyncManager] Uploading ${item.type} file to Cloudinary: ${item.fileUri}`);
        
        // Run standard Cloudinary upload
        const result = await CloudinaryService.uploadFile(item.fileUri);
        
        console.log('[SyncManager] Upload successful. Saving Cloudinary URI metadata locally.');

        // Update local document model references
        const documents = await LocalStorage.getDocuments();
        const docIndex = documents.findIndex((d) => d.id === item.docId);

        if (docIndex !== -1) {
          const doc = documents[docIndex];
          if (item.type === 'pdf') {
            doc.cloudinaryUrl = result.secure_url;
          } else if (item.type === 'processed' && item.pageId) {
            doc.pagesList = doc.pagesList.map((p) =>
              p.id === item.pageId ? { ...p, cloudinaryProcessedUrl: result.secure_url } : p
            );
          } else if (item.type === 'original' && item.pageId) {
            doc.pagesList = doc.pagesList.map((p) =>
              p.id === item.pageId ? { ...p, cloudinaryOriginalUrl: result.secure_url } : p
            );
          }
          await LocalStorage.saveDocuments(documents);
        }

        // Remove item from queue on success
        updatedQueue.splice(i, 1);
        i--; // shift index back
        await this.saveQueue(updatedQueue);
      } catch (err: any) {
        console.error(`[SyncManager] Upload failed for item ${item.id}:`, err.message);
        
        item.retryCount += 1;
        // Limit retries to 5 times. If exceeded, remove or leave in failed list
        if (item.retryCount >= 5) {
          console.warn(`[SyncManager] Item ${item.id} exceeded maximum retries. Removing.`);
          updatedQueue.splice(i, 1);
          i--;
        } else {
          item.status = 'failed';
        }
        await this.saveQueue(updatedQueue);
      }
    }
  },

  /**
   * Delete assets from Cloudinary when local items are deleted.
   */
  async deleteCloudinaryAsset(publicId: string): Promise<void> {
    try {
      await CloudinaryService.deleteFile(publicId);
      console.log(`[SyncManager] Deleted Cloudinary asset: ${publicId}`);
    } catch (e) {
      console.error('[SyncManager] Failed to delete Cloudinary asset:', e);
    }
  },
};
