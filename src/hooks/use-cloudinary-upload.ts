import { useState, useCallback } from 'react';
import { CloudinaryService, CloudinaryUploadResponse } from '@/services/cloudinary';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function useCloudinaryUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CloudinaryUploadResponse | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  const upload = useCallback(async (fileUri: string, options?: { cloudName?: string; uploadPreset?: string }) => {
    setStatus('uploading');
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const response = await CloudinaryService.uploadFile(
        fileUri,
        (p) => setProgress(p),
        options
      );
      setResult(response);
      setStatus('success');
      return response;
    } catch (e: any) {
      setError(e.message || 'Upload failed');
      setStatus('error');
      throw e;
    }
  }, []);

  return {
    upload,
    progress,
    status,
    error,
    result,
    reset,
  };
}
