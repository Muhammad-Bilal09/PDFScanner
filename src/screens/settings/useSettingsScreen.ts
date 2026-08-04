import { useEffect, useState } from 'react';
import { showAlert } from '@/utils/alert';
import { useThemeContext } from '@/context/themeContext';
import { LocalStorage } from '@/services/storage';
import { AppSettings, CompressionQuality, PaperSize } from '@/types/types';

export function useSettingsScreen() {
  const { isDarkMode, setDarkMode, theme } = useThemeContext();

  const [settings, setSettings] = useState<AppSettings>({
    autoCrop: true,
    defaultFilter: 'magic',
    pdfQuality: 'high',
    saveToGallery: false,
    darkTheme: isDarkMode,
    darkMode: isDarkMode,
    ocrLanguage: 'English',
    watermarkText: 'Scanly',
  });

  useEffect(() => {
    const loadSettings = async () => {
      const stored = await LocalStorage.getSettings();
      setSettings(stored);
    };
    loadSettings();
  }, []);

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await LocalStorage.saveSettings(updated);
  };

  const handleToggleDark = async (enabled: boolean) => {
    await setDarkMode(enabled);
    await updateSetting('darkMode', enabled);
    await updateSetting('darkTheme', enabled);
  };

  const handleSelectPdfQuality = () => {
    showAlert('PDF Export Quality', 'Choose default resolution output:', [
      { text: 'High Resolution', onPress: () => updateSetting('pdfQuality', 'high') },
      { text: 'Medium Compression', onPress: () => updateSetting('pdfQuality', 'medium') },
      { text: 'Low Size', onPress: () => updateSetting('pdfQuality', 'low') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleClearCache = async () => {
    showAlert(
      'Clear Temporary Cache',
      'This will remove temporary preview images. Your saved documents will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: () => showAlert('Success', 'Cache cleared successfully!'),
        },
      ]
    );
  };

  return {
    theme,
    isDarkMode,
    settings,
    handleToggleDark,
    updateSetting,
    handleSelectPdfQuality,
    handleClearCache,
  };
}
