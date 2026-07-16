export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
}

// Config variables loaded from environment variables
const CLOUDINARY_CONFIG = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo',
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'docs_upload',
};

export const CloudinaryService = {
  /**
   * Uploads an image or file to Cloudinary using secure REST API.
   * @param fileUri Local URI of the file to upload
   * @param options Custom cloud settings if any
   * @param onProgress Callback to report upload progress percentage
   */
  async uploadFile(
    fileUri: string,
    onProgress?: (progress: number) => void,
    options?: { cloudName?: string; uploadPreset?: string }
  ): Promise<CloudinaryUploadResponse> {
    const cloudName = options?.cloudName || CLOUDINARY_CONFIG.cloudName;
    const uploadPreset = options?.uploadPreset || CLOUDINARY_CONFIG.uploadPreset;

    if (!cloudName || cloudName === 'demo') {
      console.warn('[Cloudinary] Cloud Name is set to default "demo". Upload might fail if preset is not configured.');
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

    // Extract filename and type from URI
    const uriParts = fileUri.split('/');
    const filename = uriParts[uriParts.length - 1];
    const fileType = filename.split('.').pop()?.toLowerCase();
    
    // Determine MIME type
    let mimeType = 'image/jpeg';
    if (fileType === 'pdf') mimeType = 'application/pdf';
    else if (fileType === 'png') mimeType = 'image/png';
    else if (fileType === 'jpg' || fileType === 'jpeg') mimeType = 'image/jpeg';

    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as any);
    formData.append('upload_preset', uploadPreset);

    // Using XMLHttpRequest to get upload progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              secure_url: response.secure_url,
              public_id: response.public_id,
              format: response.format,
              resource_type: response.resource_type,
            });
          } else {
            const errMsg = response.error?.message || `Cloudinary upload failed with status ${xhr.status}`;
            reject(new Error(errMsg));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Cloudinary response: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network connection error during Cloudinary upload. Check your internet connectivity.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Cloudinary upload timed out. Please try again.'));
      };

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.send(formData);
    });
  },

  /**
   * Mock deletion check since administrative deletions require backend API secrets
   */
  async deleteFile(publicId: string, cloudName?: string): Promise<boolean> {
    const targetCloud = cloudName || CLOUDINARY_CONFIG.cloudName;
    console.log(`[Cloudinary] Deleting asset from client: ${publicId} on cloud: ${targetCloud}`);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  },
};

