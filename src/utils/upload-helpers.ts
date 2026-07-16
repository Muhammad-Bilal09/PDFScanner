/**
 * Helper utilities for preparing, compressing, and sanitizing files before upload.
 */

export const UploadHelpers = {
  /**
   * Sanitizes a filename by replacing special characters and spaces.
   */
  sanitizeFilename(name: string): string {
    const clean = name
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/_{2,}/g, '_');
    return clean || 'document';
  },

  /**
   * Format bytes to readable string (KB, MB).
   */
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Estimates image files size reductions or mock compression log info.
   */
  compressImageMock(uri: string, quality = 0.8): { uri: string; quality: number } {
    console.log(`Mock compressing image: ${uri} at quality ${quality}`);
    return { uri, quality };
  },
};
