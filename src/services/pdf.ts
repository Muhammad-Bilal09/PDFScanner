import * as Print from 'expo-print';
import * as ImageManipulator from 'expo-image-manipulator';
import { Paths } from 'expo-file-system';
import { moveAsync, getInfoAsync } from 'expo-file-system/legacy';
import { PageItemType } from '@/components/shared/DocumentCard';

const cacheDirectory = Paths.cache.uri.endsWith('/') ? Paths.cache.uri : Paths.cache.uri + '/';

export type PaperSize = 'A4' | 'Letter' | 'Legal';
export type CompressionQuality = 'original' | 'high' | 'medium' | 'low';

export interface PdfGenerationOptions {
  paperSize?: PaperSize;
  quality?: CompressionQuality;
  removeWatermark?: boolean;
}

export const PdfService = {
  /**
   * Compress a single page image based on selected quality constraints.
   */
  async compressPage(imageUri: string, quality: CompressionQuality): Promise<string> {
    if (quality === 'original') return imageUri;

    let resizeWidth = undefined;
    let qValue = 0.9;

    if (quality === 'high') {
      qValue = 0.85;
    } else if (quality === 'medium') {
      qValue = 0.70;
      resizeWidth = 1200;
    } else if (quality === 'low') {
      qValue = 0.45;
      resizeWidth = 800;
    }

    const actions: any[] = [];
    if (resizeWidth) {
      actions.push({ resize: { width: resizeWidth } });
    }

    try {
      const res = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        { compress: qValue, format: ImageManipulator.SaveFormat.JPEG }
      );
      return res.uri;
    } catch (e) {
      console.error('[PdfService] Error compressing page:', e);
      return imageUri;
    }
  },

  /**
   * Generates a high-quality PDF from a list of page objects.
   * @returns Local URI to the compiled PDF file.
   */
  async generatePdf(
    documentName: string,
    pagesList: PageItemType[],
    options: PdfGenerationOptions = {}
  ): Promise<string> {
    const {
      paperSize = 'A4',
      quality = 'high',
      removeWatermark = true,
    } = options;

    if (pagesList.length === 0) {
      throw new Error('Cannot generate PDF for an empty document.');
    }

    // Step 1: Compress and optimize page images
    const optimizedUris: string[] = [];
    for (let i = 0; i < pagesList.length; i++) {
      const page = pagesList[i];
      // Apply rotation if needed
      let processedUri = page.processedUri;
      if (page.rotation !== 0) {
        try {
          const manipResult = await ImageManipulator.manipulateAsync(
            page.processedUri,
            [{ rotate: page.rotation }],
            { format: ImageManipulator.SaveFormat.JPEG }
          );
          processedUri = manipResult.uri;
        } catch (e) {
          console.warn('[PdfService] Failed to rotate page for PDF:', e);
        }
      }
      const compUri = await this.compressPage(processedUri, quality);
      optimizedUris.push(compUri);
    }

    // Step 2: Build HTML structure
    const watermarkHtml = removeWatermark
      ? ''
      : '<div style="position: absolute; bottom: 12px; right: 12px; font-size: 11px; color: rgba(0,0,0,0.35); font-family: system-ui, sans-serif; font-weight: 600; letter-spacing: 0.5px;">Scanned by DocScan Pro</div>';

    const pagesHtml = optimizedUris
      .map((uri) => `
        <div class="page-container">
          <img src="${uri}" />
          ${watermarkHtml}
        </div>
      `)
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page {
            size: ${paperSize.toLowerCase()};
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
          }
          .page-container {
            page-break-after: always;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
          }
          img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `;

    // Step 3: Print HTML template to PDF file
    const pdfFile = await Print.printToFileAsync({ html: htmlContent });

    // Step 4: Rename/move file to match document name
    const cleanName = documentName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_") + '.pdf';
    const finalPdfUri = cacheDirectory + cleanName;

    await moveAsync({
      from: pdfFile.uri,
      to: finalPdfUri,
    });

    return finalPdfUri;
  },

  /**
   * Helper to format a file size into readable string
   */
  async getFormattedFileSize(fileUri: string): Promise<string> {
    try {
      const info = await getInfoAsync(fileUri);
      if (info.exists) {
        const bytes = info.size;
        if (bytes < 1024) return `${bytes} B`;
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        const mb = kb / 1024;
        return `${mb.toFixed(1)} MB`;
      }
      return '1.0 MB';
    } catch {
      return '1.0 MB';
    }
  }
};
