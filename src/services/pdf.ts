import * as Print from 'expo-print';
import * as ImageManipulator from 'expo-image-manipulator';
import { Paths } from 'expo-file-system';
import { moveAsync, getInfoAsync, readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { PageItemType, PaperSize, CompressionQuality, PdfGenerationOptions } from '../types/types';

const cacheDirectory = Paths.cache.uri.endsWith('/') ? Paths.cache.uri : Paths.cache.uri + '/';

export const PdfService = {
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

  async generatePdf(
    documentName: string,
    pagesList: PageItemType[],
    options: PdfGenerationOptions = {}
  ): Promise<string> {
    const {
      paperSize = 'A4',
      quality = 'high',
      addWatermark = true,
      removeWatermark = false,
      watermarkText = 'Scanly',
    } = options;

    const shouldWatermark = removeWatermark === true ? false : addWatermark;

    if (pagesList.length === 0) {
      throw new Error('Cannot generate PDF for an empty document.');
    }

    const pageDataUris: string[] = [];
    for (let i = 0; i < pagesList.length; i++) {
      const page = pagesList[i];
      let processedUri = page.croppedUri || page.originalUri;
      const pageRotation = page.rotation || 0;
      if (pageRotation !== 0) {
        try {
          const manipResult = await ImageManipulator.manipulateAsync(
            processedUri,
            [{ rotate: pageRotation }],
            { format: ImageManipulator.SaveFormat.JPEG }
          );
          processedUri = manipResult.uri;
        } catch (e) {
          console.warn('[PdfService] Failed to rotate page for PDF:', e);
        }
      }
      const compUri = await this.compressPage(processedUri, quality);

      try {
        const base64Data = await readAsStringAsync(compUri, { encoding: EncodingType.Base64 });
        pageDataUris.push(`data:image/jpeg;base64,${base64Data}`);
      } catch (e) {
        console.warn('[PdfService] Failed to read image as base64, using uri:', e);
        pageDataUris.push(compUri);
      }
    }

    const watermarkHtml = shouldWatermark
      ? `
        <div class="watermark-overlay">
          <div class="watermark-content">
            <svg width="44" height="44" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="28" fill="#DC2626"/>
              <path d="M 28 38 V 28 H 38" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M 72 38 V 28 H 62" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M 28 62 V 72 H 38" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M 72 62 V 72 H 62" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M 34 32 H 55 L 66 43 V 68 H 34 Z" fill="white"/>
            </svg>
            <span>${watermarkText}</span>
          </div>
        </div>
        <div class="watermark-badge">
          <svg width="18" height="18" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="24" fill="#DC2626"/>
            <path d="M 28 38 V 28 H 38" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 72 38 V 28 H 62" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 28 62 V 72 H 38" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 72 62 V 72 H 62" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 34 32 H 55 L 66 43 V 68 H 34 Z" fill="white"/>
          </svg>
          <span>Scanned with <strong>${watermarkText}</strong></span>
        </div>
      `
      : '';

    const pagesHtml = pageDataUris
      .map((dataUri) => `
        <div class="page-container">
          <img src="${dataUri}" />
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
          .watermark-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            opacity: 0.12;
            pointer-events: none;
            z-index: 10;
          }
          .watermark-content {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .watermark-content span {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 38px;
            font-weight: 800;
            color: #DC2626;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          .watermark-badge {
            position: absolute;
            bottom: 24px;
            right: 24px;
            background: rgba(220, 38, 38, 0.92);
            color: #FFFFFF;
            padding: 6px 14px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 13px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
            z-index: 10;
          }
          .watermark-badge strong {
            font-weight: 800;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `;

    const pdfFile = await Print.printToFileAsync({ html: htmlContent });

    const cleanName = documentName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_") + '.pdf';
    const finalPdfUri = cacheDirectory + cleanName;

    await moveAsync({
      from: pdfFile.uri,
      to: finalPdfUri,
    });

    return finalPdfUri;
  },

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
