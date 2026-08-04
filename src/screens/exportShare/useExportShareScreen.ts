import { useEffect, useState } from 'react';
import { showAlert } from '@/utils/alert';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useDocuments } from '@/hooks/useDocuments';
import { useTheme } from '@/hooks/useTheme';
import { PdfService } from '@/services/pdf';
import { CompressionQuality, DocumentItemType, PaperSize } from '@/types/types';

export function useExportShareScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { documents, updateDocument } = useDocuments();

  const [document, setDocument] = useState<DocumentItemType | null>(null);
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [quality, setQuality] = useState<CompressionQuality>('high');
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [passwordProtection, setPasswordProtection] = useState(false);

  const [generatedPdfUri, setGeneratedPdfUri] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgressMsg, setExportProgressMsg] = useState('');

  useEffect(() => {
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      setDocument({
        ...doc,
        pagesList: doc.pagesList || [],
      });
    }
  }, [id, documents]);

  const handleGeneratePdf = async (): Promise<string | null> => {
    if (!document) return null;
    const pagesList = document.pagesList || [];
    if (pagesList.length === 0) {
      showAlert('Empty Document', 'Cannot generate PDF for a document with no pages.');
      return null;
    }

    setExporting(true);
    setExportProgressMsg('Processing document pages...');

    try {
      const docName = document.name || document.title || 'Scanly_Document';
      const pdfUri = await PdfService.generatePdf(docName, pagesList, {
        paperSize,
        quality,
        removeWatermark,
      });

      const formattedSize = await PdfService.getFormattedFileSize(pdfUri);
      await updateDocument(document.id, { size: formattedSize });

      setGeneratedPdfUri(pdfUri);
      return pdfUri;
    } catch (e: any) {
      showAlert('PDF Export Failed', e.message || 'Error occurred during generation.');
      return null;
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (!document) return;

    let localUri = generatedPdfUri;
    if (!localUri) {
      localUri = await handleGeneratePdf();
    }

    if (!localUri) return;

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${document.name || document.title || 'Document'}`,
        });
      } else {
        showAlert('Sharing Unavailable', 'Native sharing is not supported on this platform.');
      }
    } catch (e) {
      showAlert('Share Error', 'Failed to share document.');
    }
  };

  const handlePrint = async () => {
    let localUri = generatedPdfUri;
    if (!localUri) {
      localUri = await handleGeneratePdf();
    }

    if (!localUri) return;

    try {
      await Print.printAsync({ uri: localUri });
    } catch (e) {
      showAlert('Print Error', 'Failed to initialize system printer.');
    }
  };

  return {
    router,
    theme,
    document,
    paperSize,
    setPaperSize,
    quality,
    setQuality,
    removeWatermark,
    setRemoveWatermark,
    passwordProtection,
    setPasswordProtection,
    setGeneratedPdfUri,
    exporting,
    exportProgressMsg,
    handleShare,
    handlePrint,
  };
}
